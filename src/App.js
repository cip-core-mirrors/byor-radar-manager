import React from 'react';
import './App.css';

import NewRadar from './NewRadar';
import Navbar from './Navbar';
import Parameters from './Parameters';
import Blips from './Blips';
import Submit from './Submit';
import Footer from './Footer';

const baseUrl = process.env.REACT_APP_DATABASE_URL;
const scope = process.env.REACT_APP_IAM_SCOPE;
const clientId = process.env.REACT_APP_IAM_CLIENT_ID;
const signIn = `${process.env.REACT_APP_IAM_URL}/authorize?response_type=id_token%20token&client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin + '/')}&scope=${encodeURIComponent(scope)}&nonce=${new Date().getTime()}`;
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

    this.state = {
      parameters: [],
      blips: [
          [],
      ],
      sectors: [],
      rings: [],
      authenticated: false,
      userInfo: undefined,
      permissions: {},
    };
  }

  handleUserInfoChange(userInfo, permissions, authenticated) {
    this.state.authenticated = authenticated;
    this.state.permissions = permissions;
    this.state.userInfo = userInfo;
    this.setState(this.state);
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

  async callApi(method, url, data) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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
      if (response.status === 401 || response.status === 403) {
        window.localStorage.removeItem('access_token');
        if (!signInWindow) {
          signInWindow = window.open(signIn, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
        }
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
            clearInterval(intervalId);
            resolve(response);
          }
        }, 500);
      } else {
        resolve(response);
      }
    })
  }

  async handleSubmit() {
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

    const radarId = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
    return await this.callApi('PUT', `${baseUrl}/radar/${radarId}`, data);
  }

  render() {
    if (window.location.pathname === '/') {
      return (
        <div className="App">
          <Navbar
            onUserInfoChange={this.handleUserInfoChange}
            authenticated={this.state.authenticated}
            permissions={this.state.permissions}
            userInfo={this.state.userInfo}
            baseUrl={baseUrl}
            callApi={this.callApi}
            signIn={signIn}
          />
          <NewRadar 
            key={this.state.userInfo}
            authenticated={this.state.authenticated}
            permissions={this.state.permissions}
            baseUrl={baseUrl}
            callApi={this.callApi}
          />
        </div>
      )
    }
    return (
      <div className="App">
        <Navbar
          onUserInfoChange={this.handleUserInfoChange}
          authenticated={this.state.authenticated}
          permissions={this.state.permissions}
          userInfo={this.state.userInfo}
          baseUrl={baseUrl}
          callApi={this.callApi}
          signIn={signIn}
        />
        <Blips
          onBlipsChange={this.handleBlipsChange}
          onSectorNameChange={this.handleSectorNameChange}
          onRingNameChange={this.handleRingNameChange}
          blips={this.state.blips}
          baseUrl={baseUrl}
          callApi={this.callApi}
        />
        <Parameters
          onParamsChange={this.handleParamsChange}
          parameters={this.state.parameters}
          baseUrl={baseUrl}
          callApi={this.callApi}
        />
        <Submit
          onSubmit={this.handleSubmit}
        />
        <Footer />
      </div>
    )
  }
}

export default App;