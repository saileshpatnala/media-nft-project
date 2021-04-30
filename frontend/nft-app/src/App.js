import logo from './logo.svg';
import './App.css';

import React from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase';


const firebaseConfig = {
  apiKey: "AIzaSyDw2NA5oyM5bTze47eA1oXifKFEwS1abVk",
  authDomain: "nftarticle.firebaseapp.com",
  projectId: "nftarticle",
  storageBucket: "nftarticle.appspot.com",
  messagingSenderId: "678103680947",
  appId: "1:678103680947:web:c1bc00990f30ee6c78edc6",
  measurementId: "G-0PK7Q9RL76"
};
firebase.initializeApp(firebaseConfig);

const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: '/signedIn',
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ]
};

class Articles extends React.Component {

  constructor(props) {
    super(props)
    this.state = { articles: null, name: '', ques: '', ans: '' }
  }

  handleChange = (event) => {
    let nam = event.target.name;
    let val = event.target.value;
    this.setState({ [nam]: val });
  }

  async fetchArticles() {
    const apiUrl = ' https://p35l1ls53m.execute-api.us-east-1.amazonaws.com/dev/articles';
    const idToken = await firebase.auth().currentUser?.getIdToken();
    const user = await firebase.auth().currentUser?.uid;
    fetch(apiUrl,
      {
        headers: {
          'Authorization': idToken,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'user_id': user
        }
      }
    )
      .then((response) => response.json())
      .then((data) => this.setState({ questions: data }));
  }

  async componentDidMount() {
    this.fetchArticles();
  }

  async createNewQuestion() {
    // const apiUrl = 'https://p35l1ls53m.execute-api.us-east-1.amazonaws.com/dev/questions';
    // const token = await firebase.auth().currentUser?.getIdToken();

    // fetch(apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': token,
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     name: this.state.name,
    //     question: this.state.ques,
    //     answer: this.state.ans
    //   })
    // });
    // this.fetchQuestions();
  }


  render() {
    return (
      <div>
        <div className="title">Articles</div>
        <ul>
          {
            this.state.articles && this.state.articles.map(article => {
              return (
                <li>
                  <div class="card">
                    <div class="card-content">
                      <div class="content">
                        <h3>Name: </h3> {article.name}
                      </div>
                      <div class="content">
                        <h3>Content: </h3> {article.article}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })
          }
        </ul>
        {/* <div>
          <div class="title">Create a Question</div>
          <label>Name <input type="text" name="name" onChange={this.handleChange}></input></label><br></br>
          <label>Question <input type="text" name="ques" onChange={this.handleChange}></input></label><br></br>
          <label>Answer <input type="text" name="ans" onChange={this.handleChange}></input></label><br></br>

          <button onClick={() => this.createNewQuestion()}>Submit</button>
        </div> */}
      </div>
    )
  };
}

class SignInScreen extends React.Component {

  // The component's Local state.
  state = {
    isSignedIn: false // Local signed-in state.
  };

  // Configure FirebaseUI.
  uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // We will display Google and Facebook as auth providers.
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: () => false
    }
  };

  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(
      (user) => this.setState({ isSignedIn: !!user })
    );
  }

  // Make sure we un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  render() {
    if (!this.state.isSignedIn) {
      return (

        <div>
          <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
              <a class="navbar-item" href="/">
                <h1 class="title">Article Fact Check</h1>
              </a>
              <div id="navbarBasicExample" class="navbar-menu">
                <div class="navbar-start"></div>
                <div class="navbar-end">
                  <div class="navbar-item">
                    <div class="buttons">

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <br></br>
          <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
          <div class="form">
            <h1 class="title">Welcome</h1>
            <h1 class="title">Please Sign In</h1>
          </div>
        </div>
      );
    }
    return (
      <div>
        <nav class="navbar" role="navigation" aria-label="main navigation">
          <div class="navbar-brand">
            <a class="navbar-item" href="/">
              <h1 class="title">Article Fact Check</h1>
            </a>
            <div id="navbarBasicExample" class="navbar-menu">
              <div class="navbar-start"></div>
              <div class="navbar-end">
                <div class="navbar-item">
                  <div class="buttons">
                    <a class="button is-primary" onClick={() => firebase.auth().signOut()}><strong>Sign Out</strong></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div class="form">
          <h1 class="title">Welcome {firebase.auth().currentUser.displayName}! You are now signed-in!</h1>
        </div>
        <Articles />
      </div>
    );
  }
}

function App() {
  return (
    new SignInScreen()
  );
}

export default App;
