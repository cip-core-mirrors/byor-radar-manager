import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";

import './App.css';

import Themes from './Themes';
import Blips from './Blips';
import MyRadars from './MyRadars';
import AllRadars from './AllRadars';
import Navbar from './Navbar';
import RadarVersions from './RadarVersions';
import Parameters from './Parameters';
import RadarBlips from './RadarBlips';
import Submit from './Submit';
import Footer from './Footer';

const baseUrl = process.env.REACT_APP_DATABASE_URL;
const scope = process.env.REACT_APP_IAM_SCOPE;
const clientId = process.env.REACT_APP_IAM_CLIENT_ID;
const signIn = `${process.env.REACT_APP_IAM_URL}/authorize?response_type=id_token%20token&client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin + '/')}&scope=${encodeURIComponent(scope)}&nonce=${new Date().getTime()}`;
const renewSignIn = `${process.env.REACT_APP_IAM_URL}/authorize?response_type=id_token%20token&client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin + '/renew')}&scope=${encodeURIComponent(scope)}&nonce=${new Date().getTime()}`;
let signInWindow = undefined;

async function getAccessToken() {
  const hash = {}
  for (const entry of (window.location.hash || '#').substring(1).split('&').map(x => x.split('='))) {
    hash[entry[0]] = entry[1]
  }

  const localStorage = window.localStorage;
  if (hash.access_token) {
    localStorage.setItem('access_token', hash.access_token);
  }

  return localStorage.getItem('access_token');
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.handleUserInfoChange = this.handleUserInfoChange.bind(this);
    this.handleParamsChange = this.handleParamsChange.bind(this);
    this.handleBlipsChange = this.handleBlipsChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSectorNameChange = this.handleSectorNameChange.bind(this);
    this.handleRingNameChange = this.handleRingNameChange.bind(this);
    this.handleRadarVersionChange = this.handleRadarVersionChange.bind(this);

    this.state = {
      isLoggingIn: true,
      parameters: [],
      blips: [
          [],
      ],
      sectors: [],
      rings: [],
      radarId: undefined,
      version: undefined,
      fork: undefined,
      forkVersion: undefined,
      authenticated: false,
      userInfo: undefined,
      permissions: {},
      myRadarsKey: 0,
      allRadarsKey: 0,
    };
  }

  updateMyRadars() {
    this.state.myRadarsKey += 1;
    this.setState(this.state);
  }

  updateAllRadars() {
    this.state.allRadarsKey += 1;
    this.setState(this.state);
  }

  handleUserInfoChange(userInfo, permissions, authenticated) {
    this.state.authenticated = authenticated;
    this.state.permissions = permissions;
    this.state.userInfo = userInfo;
    this.state.isLoggingIn = false;
    this.setState(this.state);
    this.updateMyRadars();
  }

  handleParamsChange(params) {
    this.state.parameters = params;
    this.setState(this.state);
  }

  handleBlipsChange(blips) {
    this.state.blips = blips;
    this.setState(this.state);
  }

  handleSectorNameChange(sectorsName) {
    this.state.sectors = sectorsName;
    this.setState(this.state);
  }

  handleRingNameChange(ringsName) {
    this.state.rings = ringsName;
    this.setState(this.state);
  }

  handleRadarVersionChange(radarId, version, fork, forkVersion) {
    this.state.radarId = radarId;
    this.state.version = version;
    this.state.fork = fork;
    this.state.forkVersion = forkVersion;
    this.setState(this.state);
  }

  async callApi(method, url, data) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }

    const config = {
      method: method,
      headers: headers,
      //mode: 'no-cors',
    }
    if (data) config.body = JSON.stringify(data);

    return new Promise(async function(resolve, reject) {
      let response = await fetch(url, config);
      if (response.status === 401) {
        window.localStorage.removeItem('access_token');
        if (!signInWindow) {
          signInWindow = window.open(renewSignIn, 'signInFrame');
        }

        let timeout = 10; // in seconds
        const begin = new Date();
        const intervalId = setInterval(async function() {
          const accessToken = window.localStorage.getItem('access_token');
          if (accessToken) {
            headers.authorization = `Bearer ${accessToken}`;
            if (signInWindow) {
              signInWindow.close();
              signInWindow = undefined;
            } 
            clearInterval(intervalId);
            response = await fetch(url, config);
            resolve(response);
          } else if (signInWindow.closed) {
            signInWindow = undefined;
            clearInterval(intervalId);
            resolve(response);
          } else {
            if ((new Date() - begin) > timeout * 1000) {
              reject();
            }
          }
        }, 50);
      } else {
        resolve(response);
      }
    })
  }

  async handleSubmit(arg) {
    const links = [];
    let sectorIndex = 0;
    for (const sector of this.state.blips.slice(1)) {
      let ringIndex = 0;
      for (const ring of sector) {
        for (const blip of ring) {
          const toPush = {
            blip: blip.id,
            version: blip.version,
            oldRing: '',
            ring: this.state.rings[ringIndex],
            sector: this.state.sectors[sectorIndex],
            value: blip.value,
          };
          links.push(toPush);
        }
        ringIndex++;
      }
      sectorIndex++;
    }

    const data = {
      links: links,
      parameters: this.state.parameters
        .filter(param => (param.value !== undefined) || (param.default !== undefined))
        .map(function(param) {
          return {
            name: param.name,
            value: param.value || param.default,
          };
        }),
    };

    for (const key of arg.keys) {
      if (this.state[key] !== undefined) data[key] = this.state[key];
    }
    delete arg.keys;
    
    for (const entry of Object.entries(arg)) {
      data[entry[0]] = entry[1];
    }

    return await this.callApi('PUT', `${baseUrl}/radar/${this.state.radarId}`, data);
  }

  render() {
    const parent = this;
    
    let paths = window.location.pathname.split('/').slice(1);
    paths = paths.slice(paths.length - 2);

    const navbar = <Navbar
      onUserInfoChange={this.handleUserInfoChange}
      authenticated={this.state.authenticated}
      permissions={this.state.permissions}
      userInfo={this.state.userInfo}
      baseUrl={baseUrl}
      callApi={this.callApi}
      signIn={signIn}
    />;

    return <Router>
      <div className="App">
        {navbar}
        <Switch>
          <Route path="/radars/:radarId/edit">
            <div className="edit-radar">
              <RadarBlips
                onBlipsChange={this.handleBlipsChange}
                onSectorNameChange={this.handleSectorNameChange}
                onRingNameChange={this.handleRingNameChange}
                onRadarVersionChange={this.handleRadarVersionChange}
                baseUrl={baseUrl}
                callApi={this.callApi}
                isLoggingIn={this.state.isLoggingIn}
              />
              <Parameters
                onParamsChange={this.handleParamsChange}
                parameters={this.state.parameters}
                baseUrl={baseUrl}
                callApi={this.callApi}
                isLoggingIn={this.state.isLoggingIn}
              />
              <Submit
                key={this.state.userInfo}
                baseUrl={baseUrl}
                callApi={this.callApi}
                userInfo={this.state.userInfo}
                radarId={this.state.radarId}
                version={this.state.version}
                fork={this.state.fork}
                forkVersion={this.state.forkVersion}
                onSubmit={async function(arg) {
                  return await parent.handleSubmit(arg);
                }}
              />
            </div>
          </Route>
          <Route path="/radars/:radarId">
            <div className="versions-radar">
              <RadarVersions
                onRadarVersionChange={this.handleRadarVersionChange}
                baseUrl={baseUrl}
                callApi={this.callApi}
                isLoggingIn={this.state.isLoggingIn}
              ></RadarVersions>
            </div>
          </Route>
          <Route path="/radars">
            <div className="radars">
              <MyRadars
                key={`my-radars-${this.state.myRadarsKey}`}
                authenticated={this.state.authenticated}
                userInfo={this.state.userInfo}
                permissions={this.state.permissions}
                baseUrl={baseUrl}
                callApi={this.callApi}
                update={function() {
                  parent.updateAllRadars();
                }}
                isLoggingIn={this.state.isLoggingIn}
              />
              <AllRadars
                key={`all-radars-${this.state.allRadarsKey}`}
                authenticated={this.state.authenticated}
                userInfo={this.state.userInfo}
                permissions={this.state.permissions}
                baseUrl={baseUrl}
                callApi={this.callApi}
                update={function() {
                  parent.updateMyRadars();
                }}
                isLoggingIn={this.state.isLoggingIn}
              />
            </div>
          </Route>
          <Route path="/blips">
            <Blips
              authenticated={this.state.authenticated}
              permissions={this.state.permissions}
              userInfo={this.state.userInfo}
              baseUrl={baseUrl}
              callApi={this.callApi}
              isLoggingIn={this.state.isLoggingIn}
            />
          </Route>
          <Route path="/themes">
            <Themes
              authenticated={this.state.authenticated}
              permissions={this.state.permissions}
              userInfo={this.state.userInfo}
              baseUrl={baseUrl}
              callApi={this.callApi}
              isLoggingIn={this.state.isLoggingIn}
            />
          </Route>
          <Route path="/renew">
            <div/>
          </Route>
          <Route path="/">
            <Redirect to='/radars'/>
          </Route>
        </Switch>
        <Footer />
      </div>
    </Router>;
  }
}

export default App;