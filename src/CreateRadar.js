import React from 'react';
import './CreateRadar.css';

import ButtonLegend from './ButtonLegend';

class CreateRadar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            radarName: undefined,
            errorMessage: undefined,
            successMessage: undefined,
        }
    }

    async createRadar() {
        this.state.errorMessage = undefined;
        this.state.successMessage = undefined;
        
        let radarId = (this.state.radarName || '').trim();
        radarId = radarId.toLowerCase();
        radarId = radarId.replace(/\s\s+/g, ' ');
        radarId = radarId.replace(/ /g, '-');
        const match = radarId.match(/^[a-z0-9\-]+$/i);
        if (radarId.length < 3) {
            this.state.errorMessage = 'Name too short (must be at least 3 characters)';
        } else if (radarId.length > 256) {
            this.state.errorMessage = 'Name too long (should not exceed 256 characters)';
        } else if (match) {
            this.state.errorMessage = undefined;
            const response = await this.props.callApi('POST',  `${this.props.baseUrl}/radar`, {
                id: radarId,
            });
            if (response.ok) {
                document.getElementById(this.props.createId).value = '';
                this.state.successMessage = 'Your radar has been successfully created';
                await this.props.updateRadarsList(false);
            } else if (response.status === 404) {
                const data = await response.json();
                this.state.errorMessage = data.message;
            }
        } else {
            this.state.errorMessage = 'Name should be alphanumerical';
        }
        this.setState(this.state);
    }

    render() {
        const parent = this;
        const state = parent.state;
        if (this.props.permissions.createRadar) {
            return (
                <div className="new-radar-grid border-top">
                    <form className="create-radar">
                        <div
                            className="form-group"
                            style={{
                                marginBottom: 0,
                            }}
                        >
                            <label className="paramName">Radar name &nbsp;</label>
                            <input
                                type="text"
                                className="form-control form-control-alt"
                                id={this.props.createId}
                                onChange={function(e) {
                                    state.radarName = e.target.value;
                                }}
                                onKeyDown={async function(e) {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        await parent.createRadar()
                                    }
                                }}
                            />
                            { this.state.errorMessage ? <label
                                className="text-danger"
                                style={{
                                    display: 'inline-block',
                                    marginBottom: 0,
                                }}
                            >
                                {this.state.errorMessage}
                            </label> : null }
                            { this.state.successMessage ? <label
                                className="text-success"
                                style={{
                                    display: 'inline-block',
                                    marginBottom: 0,
                                }}
                            >
                                {this.state.successMessage}
                            </label> : null }
                        </div>
                    </form>
                    <input
                        readOnly
                        value="Create radar"
                        className="submit-btn btn btn-lg btn-primary"
                        onClick={async function(e) {
                            await parent.createRadar()
                        }}
                    />
                    <ButtonLegend/>
                </div>
            )
        } else if (this.props.authenticated) {
            return (
                <div className="new-radar-grid border-top">
                    <div className="new-radar">You are not authorized to create a radar</div>
                </div>
            )
        } else {
            return null;
        }
    }
}

export default CreateRadar;