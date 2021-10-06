import React from 'react';
import './App.css';

import NewRadar from './NewRadar';
import Navbar from './Navbar';
import Parameters from './Parameters';
import Blips from './Blips';
import Submit from './Submit';
import Footer from './Footer';

const baseUrl = process.env.REACT_APP_DATABASE_URL;

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
    };
  }

  handleUserInfoChange(userInfo, authenticated) {
    this.state.authenticated = authenticated;
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
    return await fetch(`${baseUrl}/radar/${radarId}`, {
      method: 'PUT',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
      },
      //mode: 'no-cors',
      body: JSON.stringify(data),
    });
  }

  render() {
    if (window.location.pathname === '/') {
      return (
        <div className="App">
          <Navbar
            onUserInfoChange={this.handleUserInfoChange}
            authenticated={this.state.authenticated}
            userInfo={this.state.userInfo}
          />
          <NewRadar 
            authenticated={this.state.authenticated}
            userInfo={this.state.userInfo}
          />
        </div>
      )
    }
    return (
      <div className="App">
        <Navbar
          onUserInfoChange={this.handleUserInfoChange}
          authenticated={this.state.authenticated}
          userInfo={this.state.userInfo}
        />
        <Blips
            onBlipsChange={this.handleBlipsChange}
            onSectorNameChange={this.handleSectorNameChange}
            onRingNameChange={this.handleRingNameChange}
            blips={this.state.blips}
            baseUrl={baseUrl}
        />
        <Parameters
          onParamsChange={this.handleParamsChange}
          parameters={this.state.parameters}
          baseUrl={baseUrl}
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