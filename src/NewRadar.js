import React from 'react';
import './NewRadar.css';

class NewRadar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            radarName: undefined,
            errorMessage: undefined,
            radarsList: [],
            deletingRadar: undefined,
        }
    }

    async componentDidMount() {
        if (!this.props.authenticated) return;

        await this.updateRadarsList();
    }

    async updateRadarsList() {
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/radar`);
        this.state.radarsList = await response.json();
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

    async createRadar() {
        let radarId = (this.state.radarName || '').trim();
        radarId = radarId.toLowerCase();
        radarId = radarId.replace(/\s\s+/g, ' ');
        radarId = radarId.replace(/ /g, '-');
        const match = radarId.match(/^[a-z0-9\-]+$/i);
        if (match) {
            this.state.errorMessage = undefined;
            const response = await this.props.callApi('POST',  `${this.props.baseUrl}/radar`, {
                id: radarId,
            });
            if (response.ok) {
                document.getElementById('radar-id').value = '';
                await this.updateRadarsList();
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
        const state = this.state;
        if (!this.props.authenticated) {
            return (
                <div className="new-radar">Please login in order to create a radar</div>
            )
        } else {
            return (
                <div className="new-radar">
                    <div className="radars-list">
                        <h3>My radars</h3>
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
                                            radar.rights.indexOf('edit') !== -1 ?
                                            <a
                                                className="radar-edit"
                                                href={`./${radar.id}`}
                                            >
                                                Edit
                                            </a> :
                                            <div/>
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
                                            </a> :
                                            <div/>
                                        }
                                        {
                                            radar.rights.indexOf('owner') !== -1 ?
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
                                                    radar.editors.map(editor => 
                                                        <li
                                                            key={editor}
                                                            className="radar-editor-item list-group-item border-light"
                                                        >
                                                            {editor}
                                                        </li>
                                                    )
                                                }
                                            </ul> :
                                            <div/>
                                        }
                                    </li>
                                )
                            }
                        </ul>
                    </div>
                    {
                        this.props.permissions.createRadar ? 
                        <div className="new-radar-grid border-top">
                            <form className="create-radar">
                                <div className="form-group">
                                    <label className="paramName">Radar name &nbsp;</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-alt"
                                        id="radar-id"
                                        onChange={function(e) {
                                            state.radarName = e.target.value;
                                        }}
                                    />
                                    <label
                                        className="text-danger"
                                        style={{
                                            display: this.state.errorMessage ? 'inline-block' : 'none',
                                            marginBottom: 0,
                                        }}
                                    >
                                        {this.state.errorMessage}
                                    </label>
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
                        </div> :
                        <div className="grid">
                            <div className="new-radar border-top">You are not authorized to create a radar</div>
                        </div>
                    }
                </div>
            )
        }
    }
}

export default NewRadar;