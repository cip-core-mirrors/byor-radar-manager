import React from 'react';
import {
    withRouter,
} from "react-router-dom";

import ButtonLegend from './ButtonLegend';
import './Submit.css'

class Submit extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {
            submitting: false,
            success: undefined,
            isOwner: false,
        };
    }

    async componentDidMount() {
        if (!this.props.userInfo) return;

        const response = await this.props.callApi('GET', `${this.props.baseUrl}/radars`);
        const radarsList = await response.json();
        const radarId = this.props.match.params.radarId;

        const userId = this.props.userInfo.mail;

        for (const radar of radarsList) {
            if (radar.id === radarId) {
                for (const permission of radar.permissions) {
                    if (permission.user_id === userId) {
                        this.state.isOwner = permission.rights.indexOf('owner') !== -1;
                        this.setState(this.state);
                        return;
                    }
                }
            }
        }
    }

    async handleSubmit(arg) {
        if (this.state.submitting) {
            return;
        }

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.onSubmit(arg);
        this.state.success = response.ok;

        this.setState(this.state);
        const parent = this;
        setTimeout(() => {
            parent.state.success = undefined;
            parent.state.submitting = false;
            parent.setState(this.state);
        }, 5000);
    }

    render() {
        const parent = this;

        return (
            <div className="submit-radar-button-grid">
                <div className="submit-buttons-grid">
                    {
                        this.props.radarId !== null && this.props.version !== null && this.props.fork !== null && this.props.forkVersion !== null ? 
                        <input
                            //type="submit"
                            readOnly
                            value="Save"
                            className={`submit-btn btn btn-lg ${this.state.success === undefined ? 'btn-primary' : (this.state.success ? 'btn-success' : 'btn-danger')}`}
                            onClick={function(e) {
                                parent.handleSubmit({
                                    commit: false,
                                    keys: [ 'version', 'fork', 'forkVersion' ],
                                });
                            }}
                        /> : null
                    }
                    {
                        this.props.radarId !== null && this.props.version !== null && this.props.fork !== null && this.props.forkVersion !== null ? 
                        <input
                            //type="submit"
                            readOnly
                            value="Commit"
                            className={`submit-btn btn btn-lg ${this.state.success === undefined ? 'btn-primary' : (this.state.success ? 'btn-success' : 'btn-danger')}`}
                            onClick={function(e) {
                                parent.handleSubmit({
                                    commit: true,
                                    keys: [ 'version', 'fork' ],
                                });
                            }}
                        /> : null
                    }
                    {
                        this.props.radarId !== null && this.props.version !== null && this.props.fork === null && this.props.forkVersion === null ? 
                        <input
                        //type="submit"
                        readOnly
                        value="Fork"
                        className={`submit-btn btn btn-lg ${this.state.success === undefined ? 'btn-primary' : (this.state.success ? 'btn-success' : 'btn-danger')}`}
                        onClick={function(e) {
                            parent.handleSubmit({
                                commit: true,
                                keys: [ 'version' ],
                            });
                        }}
                    /> : null
                    }
                    {
                        this.state.isOwner && this.props.radarId !== null && this.props.version !== null && this.props.fork !== null && this.props.forkVersion !== null ? 
                        <input
                            //type="submit"
                            readOnly
                            value="New version"
                            className={`submit-btn btn btn-lg ${this.state.success === undefined ? 'btn-primary' : (this.state.success ? 'btn-success' : 'btn-danger')}`}
                            onClick={function(e) {
                                parent.handleSubmit({
                                    commit: true,
                                    keys: [],
                                });
                            }}
                        /> : null
                    }
                </div>
                <ButtonLegend/>
            </div>
        );
    }
}

export default withRouter(Submit);