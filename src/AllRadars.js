import React from 'react';
import './MyRadars.css';

import CreateRadar from './CreateRadar';

class AllRadars extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            radarName: undefined,
            errorMessage: undefined,
            radarsList: [],
            deletingRadar: undefined,
            adminUrl: this.props.baseUrl + '/admin',
        }
    }

    async componentDidMount() {
        await this.updateRadarsList(false);
    }

    async updateRadarsList(updateList = true) {
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/radars`);
        this.state.radarsList = await response.json();
        
        if (updateList) {
            this.props.update();
        }

        this.setState(this.state);
    }

    async deleteRadar(radarId) {
        if (this.state.deletingRadar) return;

        this.state.deletingRadar = radarId;
        const response = await this.props.callApi('DELETE', `${this.state.adminUrl}/radar/${radarId}`);
        this.state.deletingRadar = undefined;

        if (response.ok) {
            await this.updateRadarsList();
        }
    }

    async addEditor(userId, radarId) {
        userId = userId.trim();
        const match = userId.match(/^\S+@\S+\.\S+$/);
        if (match) {
            const response = await this.props.callApi('POST', `${this.state.adminUrl}/radar/${radarId}/permissions`, {
                user_id: userId,
                rights: ['edit'],
            });
            if (response.ok) {
                document.getElementById(`add-editor-admin-${radarId}`).value = '';
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
        const response = await this.props.callApi('DELETE', `${this.state.adminUrl}/radar/${radarId}/permissions/${userId}`);
        if (response.ok) {
            document.getElementById(`add-editor-admin-${radarId}`).value = '';
            await this.updateRadarsList();
        } else if (response.state === 403) {
            const data = await response.json();
            this.state.errorMessage = data.message;
        }
    }

    render() {
        const parent = this;
        return (
            <div className="new-radar">
                <div className="radars-list">
                    <h3>All radars</h3>
                    <ul className="radar-list-group list-group-flush">
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
                                        {radar.id}
                                    </label>
                                    {
                                        true ?
                                        <a
                                            className="radar-view"
                                            href={`${process.env.REACT_APP_RADAR_URL}?sheetId=${radar.id}`}
                                            target="_blank"
                                        >
                                            View
                                        </a> :
                                        <div/>
                                    }
                                    {
                                        this.props.permissions.adminUser ?
                                        <a
                                            className="radar-edit"
                                            href={`./${radar.id}`}
                                        >
                                            Edit
                                        </a> :
                                        <div/>
                                    }
                                    {
                                        this.props.permissions.adminUser ?
                                        <a
                                            className="radar-delete"
                                            onClick={function(e) {
                                                parent.deleteRadar(radar.id);
                                            }}
                                        >
                                            Delete
                                        </a> :
                                        <div/>
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
                                                        className={`radar-editor-item list-group-item border-light ${permission.rights.indexOf('owner') !== -1 ? 'font-weight-bold' : ''}`}
                                                    >
                                                        {permission.user_id}&nbsp;
                                                        <i>
                                                            {this.props.userInfo === undefined ? '' :
                                                                (
                                                                    this.props.userInfo.mail === permission.user_id ? '(you)' :
                                                                    (
                                                                        permission.rights.indexOf('owner') !== -1 ? '(owner)' : ''
                                                                    )
                                                                )
                                                            }
                                                        </i>
                                                        {
                                                            this.props.permissions.adminUser ? 
                                                            <button
                                                                className="btn btn-lg btn-discreet-danger"
                                                                type="button"
                                                                onClick={async function(e) {
                                                                    await parent.removeEditor(permission.user_id, radar.id);
                                                                }}
                                                            >
                                                                <i className="icon">remove</i>
                                                            </button> :
                                                            <div/>
                                                        }
                                                    </li>
                                                )
                                            }
                                            {
                                                this.props.permissions.adminUser ?
                                                <div
                                                    className="input-group mb-3"
                                                    style={{
                                                        marginTop: "0.3em",
                                                    }}
                                                >
                                                    <input className="form-control form-control-lg" id={`add-editor-admin-${radar.id}`} type="text" placeholder="john.doe@socgen.com" aria-label="" />
                                                    <button
                                                        className="btn btn-lg btn-discreet-success"
                                                        type="button"
                                                        onClick={async function(e) {
                                                            const email = document.getElementById(`add-editor-admin-${radar.id}`).value;
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
                    </ul>
                </div>
                {this.props.permissions.adminUser ?
                <CreateRadar 
                    key={this.props.authenticated}
                    authenticated={this.props.authenticated}
                    permissions={this.props.permissions}
                    baseUrl={this.state.adminUrl}
                    callApi={this.props.callApi}
                    createId="radar-id-admin"
                    updateRadarsList={async function() {
                        await parent.updateRadarsList();
                    }}
                /> : null}
            </div>
        )
    }
}

export default AllRadars;