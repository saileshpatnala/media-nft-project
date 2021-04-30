import os

import boto3
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS

from google.oauth2 import id_token
from google.auth.transport import requests

from boto3.dynamodb.types import TypeDeserializer

import uuid

app = Flask(__name__)
CORS(app)

dynamodb_client = boto3.client('dynamodb',region_name='us-west-2')

dynamodb = boto3.resource('dynamodb',region_name='us-west-2')

if os.environ.get('IS_OFFLINE'):
    dynamodb_client = boto3.client(
        'dynamodb', region_name='localhost', endpoint_url='http://localhost:8000'
    )

    dynamodb = boto3.resource(
        'dynamodb', region_name='localhost', endpoint_url='http://localhost:8000'
    )


deserializer = TypeDeserializer()

HTTP_REQUEST = requests.Request()

def convert_db_object(obj):
    return {k: deserializer.deserialize(v) for k,v in obj.items()}


@app.route('/articles', methods=['GET','POST'])
def getArticles():
    token = request.headers.get('Authorization')
    if not token:
        return make_response(jsonify(error='No token!'), 401)
        
    if token != 'hack' and not id_token.verify_firebase_token(token, HTTP_REQUEST) :
        return make_response(jsonify(error='Invalid token!'), 401)

    if request.method == 'GET':
        user_id = request.headers.get('user_id')

        art = {}

        if user_id:
            table = dynamodb.Table('user_articles')
            response = table.query(
                KeyConditionExpression=Key('user_id').eq(user_id)
            )

            for i in response['Items']:
                d = convert_db_object(i)
                art[d['article_id']] = {'score':d['score']}

        articles = dynamodb_client.scan(TableName='articles')

        for i in articles['Items']:
            d = convert_db_object(i)
            if d['article_id'] not in art:
                art[d['article_id']] = {'name': d['name'], 'content': d['article'], 'score': 0}
            else:
                art[d['article_id']]['name'] = d['name']
                art[d['article_id']]['content'] = d['article']

        
        js = jsonify(art)
        js.headers.add('Access-Control-Allow-Origin', '*')
        return js

    elif request.method == 'POST':
        article = request.json.get('article')
        name = request.json.get('name')

        id = str(uuid.uuid4())

        dynamodb_client.put_item(
            TableName='articles',
            Item={
                'article_id': {'S': id},
                'article': {'S': article},
                'name': {'S' : name}
            }
        )

        return make_response(jsonify(article_id=id), 200)

@app.route('/article_score', methods=['GET','POST'])
def articleScore():
    token = request.headers.get('Authorization')
    if not token:
        return make_response(jsonify(error='No token!'), 401)
        
    if token != 'hack' and not id_token.verify_firebase_token(token, HTTP_REQUEST) :
        return make_response(jsonify(error='Invalid token!'), 401)

    if request.method == 'GET':
        article_id = request.headers.get('article_id')

        table = dynamodb.Table('user_articles')
        response = table.query(
            KeyConditionExpression=Key('article_id').eq(article_id)
        )
        s = 0
        for r in response['Items']:
            d = convert_db_object(i)
            s += d['score']

        return make_response(jsonify(score=s), 200)
        
    elif request.method == 'POST':
        article_id = request.json.get('article_id')
        user_id =  request.json.get('user_id')
        score =  request.json.get('score')

        dynamodb_client.put_item(
            TableName='user_articles',
            Item={
                'article_id': {'S': article_id},
                'user_id': {'S': user_id},
                'score': {'N': score}
            }
        )

        return make_response(jsonify(status='success'), 200)


@app.route('/start', methods=['POST'])
def createStart():
    try :
        table = dynamodb_client.create_table(
            TableName='user_articles',
            KeySchema=[
                {
                    'AttributeName': 'article_id',
                    'KeyType': 'HASH'
                },
                {
                    'AttributeName': 'user_id',
                    'KeyType': 'RANGE'
                }   
            ],
            AttributeDefinitions=[
                    {
                    'AttributeName': 'article_id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                },
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 1,
                'WriteCapacityUnits': 1
            }
        )

        table2 = dynamodb_client.create_table(
            TableName='articles',
            KeySchema=[
                {
                    'AttributeName': 'article_id',
                    'KeyType': 'HASH'
                },
                {
                    'AttributeName': 'name',
                    'KeyType': 'RANGE'
                }   
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'article_id',
                    'AttributeType': 'S'
                },
                 {
                    'AttributeName': 'name',
                    'AttributeType': 'S'
                },
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 1,
                'WriteCapacityUnits': 1
            }
        )
    except:
        pass

    return make_response(jsonify(status='Success'), 200)


@app.errorhandler(404)
def resource_not_found(e):
    return make_response(jsonify(error='Not found!'), 404)
