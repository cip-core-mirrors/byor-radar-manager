import React from 'react';
import './App.css';
import Parameters from './Parameters';
import Blips from './Blips';
import Submit from './Submit';

const baseUrl = process.env.REACT_APP_DATABASE_URL;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.handleParamsChange = this.handleParamsChange.bind(this);
    this.handleBlipsChange = this.handleBlipsChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      parameters: [],
      blips: {
        droppable0: [
            [],
        ],
        droppable1: [
            [],
        ],
      },
    };
  }

  handleParamsChange(params) {
    this.setState({
      parameters: params,
      blips: this.state.blips,
    });
  }

  handleBlipsChange(blips) {
    this.setState({
      parameters: this.state.parameters,
      blips: blips,
    });
  }

  async handleSubmit() {
    const data = {
      links: [],
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
    return (
      <div className="App">
        <Parameters
          onParamsChange={this.handleParamsChange}
          parameters={this.state.parameters}
          baseUrl={baseUrl}
        />
        <Blips
          onBlipsChange={this.handleBlipsChange}
          blips={this.state.blips}
          baseUrl={baseUrl}
        />
        <Submit
          onSubmit={this.handleSubmit}
        />
      </div>
    )
  }
}

export default App;