import React from 'react';
import {
    Link,
    withRouter,
  } from "react-router-dom";
import './MyRadars.css';

import Spinner from './Spinner';
import CreateRadar from './CreateRadar';

class MyRadars extends React.Component {
    constructor(props) {
        super(props);
        const { path, url } = this.props.match;
        this.state = {
            isFirstRefresh: true,
            isLoading: true,
            radarName: undefined,
            errorMessage: undefined,
            radarsList: [],
            deletingRadar: undefined,
            path,
            url,
        };
    }

    async componentDidMount() {
        this.state.isLoading = false;
        this.setState(this.state);
    }

    async updateRadarsList(updateList = true) {
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/radar`);
        this.state.radarsList = await response.json();
        this.state.radarsList.sort(function(a, b) {
            if (a.id < b.id) return -1;
            else if (a.id > b.id) return 1;
            return 0;
        })

        if (updateList) {
            this.props.update();
        }
        
        this.setState(this.state);
    }

    async deleteRadar(radarId) {
        if (this.state.deletingRadar) return;

        this.state.deletingRadar = radarId;
        const response = await this.props.callApi('DELETE', `${this.props.baseUrl}/radar/${radarId}`);
        this.state.deletingRadar = undefined;

        if (response.ok) {
            await this.updateRadarsList();
        }
    }

    async addEditor(userId, radarId) {
        userId = userId.trim();
        const match = userId.match(/^\S+@\S+\.\S+$/);
        if (match) {
            const response = await this.props.callApi('POST', `${this.props.baseUrl}/radar/${radarId}/permissions`, {
                user_id: userId,
                rights: ['edit'],
            });
            if (response.ok) {
                document.getElementById(`add-editor-${radarId}`).value = '';
                await this.updateRadarsList();
            } else if (response.state === 403) {
                const data = await response.json();
                this.state.errorMessage = data.message;
            }
        } else {
            this.state.errorMessage = 'Please enter a valid email address';
        }
        this.setState(this.state);
    }

    async removeEditor(userId, radarId) {
        const response = await this.props.callApi('DELETE', `${this.props.baseUrl}/radar/${radarId}/permissions/${userId}`);
        if (response.ok) {
            document.getElementById(`add-editor-${radarId}`).value = '';
            await this.updateRadarsList();
        } else if (response.state === 403) {
            const data = await response.json();
            this.state.errorMessage = data.message;
        }
    }

    async setRadarState(radarId, radarState) {
        const response = await this.props.callApi('PUT', `${this.props.baseUrl}/radar/${radarId}`, {
            state: radarState,
        });
        if (response.ok) {
            await this.updateRadarsList();
        } else if (response.state === 403) {
            const data = await response.json();
            this.state.errorMessage = data.message;
        }
    }

    async firstRefresh() {
        this.state.isFirstRefresh = false;
        this.setState(this.state);

        if (this.props.authenticated) {
            await this.updateRadarsList(false);
        };
    }

    async componentDidUpdate() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn && !this.state.isLoading) {
                this.firstRefresh();
            }
        }
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner/>;

        if (!this.props.authenticated) {
            return (
                <div className="new-radar">Please login in order to create a radar</div>
            )
        } else {
            const parent = this;
            const radarsList = <ul className="radar-list-group list-group-flush">
                {
                    this.state.radarsList.map(radar =>
                        <li
                            className="radar-item list-group-item border-light"
                            key={radar.id}
                        >
                            <label
                                className="radar-label"
                                style={{
                                    marginBottom: 0,
                                }}
                            >
                                {radar.id} {radar.state === 0 ? '(draft)' : ''}
                            </label>
                            {
                                true ?
                                <a
                                    className="radar-view"
                                    href={`${process.env.REACT_APP_RADAR_URL}?sheetId=${radar.id}`}
                                    target="_blank"
                                >
                                    View
                                </a> : null
                            }
                            {
                                radar.rights.indexOf('edit') !== -1 ?
                                <Link
                                    className="radar-edit"
                                    to={`${this.state.url}/${radar.id}`}
                                >
                                    Edit
                                </Link> : null
                            }
                            {
                                radar.rights.indexOf('owner') !== -1 ?
                                <a
                                    className="radar-state"
                                    onClick={function(e) {
                                        parent.setRadarState(radar.id, radar.state === 0 ? 1 : 0);
                                    }}
                                >
                                    {radar.state === 0 ? 'Publish' : 'Draft'}
                                </a> : null
                            }
                            {
                                radar.rights.indexOf('owner') !== -1 ?
                                <a
                                    className="radar-delete"
                                    onClick={function(e) {
                                        parent.deleteRadar(radar.id);
                                    }}
                                >
                                    Delete
                                </a> : null
                            }
                            {
                                <ul
                                    className="radar-editors list-group-flush"
                                >
                                    <p
                                        className="font-weight-bold text-secondary"
                                        style={{
                                            marginBottom: 0,
                                        }}
                                    >
                                        Editors
                                    </p>
                                    {
                                        radar.permissions.map(permission => 
                                            <li
                                                key={permission.user_id}
                                                className="radar-editor-item list-group-item border-light"
                                            >
                                                <label>
                                                    <label
                                                        className={this.props.userInfo.mail === permission.user_id ? 'font-weight-bold' : ''}
                                                        style={{
                                                            marginBottom: 0,
                                                        }}
                                                    >
                                                        {permission.user_id}
                                                    </label>
                                                    <label
                                                        className="text-light"
                                                        style={{
                                                            marginBottom: 0,
                                                        }}
                                                    >
                                                        &nbsp;
                                                        {this.props.userInfo === undefined ? '' :
                                                            (
                                                                permission.rights.indexOf('owner') !== -1 ? '- owner' : ''
                                                            )
                                                        }
                                                    </label>
                                                </label>
                                                {
                                                    radar.rights.indexOf('owner') !== -1 && permission.rights.indexOf('owner') === -1 ? 
                                                    <button
                                                        className="btn btn-lg btn-discreet-danger"
                                                        type="button"
                                                        onClick={async function(e) {
                                                            await parent.removeEditor(permission.user_id, radar.id);
                                                        }}
                                                    >
                                                        <i className="icon">remove</i>
                                                    </button> :
                                                    null
                                                }
                                            </li>
                                        )
                                    }
                                    {
                                        radar.rights.indexOf('owner') !== -1 ?
                                        <div
                                            className="input-group mb-3"
                                            style={{
                                                marginTop: "0.3em",
                                            }}
                                        >
                                            <input className="form-control form-control-lg" id={`add-editor-${radar.id}`} type="text" placeholder="john.doe@socgen.com" aria-label="" />
                                            <button
                                                className="btn btn-lg btn-discreet-success"
                                                type="button"
                                                onClick={async function(e) {
                                                    const email = document.getElementById(`add-editor-${radar.id}`).value;
                                                    parent.addEditor(email, radar.id);
                                                }}
                                            >
                                                <i className="icon">add</i>
                                            </button>
                                        </div> : null
                                    }
                                </ul>
                            }
                        </li>
                    )
                }
            </ul>;
            return (
                <div className="new-radar">
                    <div className="radars-list">
                        <h3>My radars</h3>
                        {
                            this.state.radarsList.length > 0 ?
                            radarsList :
                            <div>Your radars list is empty</div>
                        }
                    </div>
                    <CreateRadar 
                        key={this.props.authenticated}
                        authenticated={this.props.authenticated}
                        permissions={this.props.permissions}
                        baseUrl={this.props.baseUrl}
                        callApi={this.props.callApi}
                        createId="radar-id"
                        updateRadarsList={async function() {
                            await parent.updateRadarsList();
                        }}
                    />
                </div>
            )
        }
    }
}

export default withRouter(MyRadars);