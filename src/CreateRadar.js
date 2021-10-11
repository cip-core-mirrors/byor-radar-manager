import React from 'react';
import './CreateRadar.css';

class CreateRadar extends React.Component {
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

    async addEditor(userId, radarId) {
        userId = userId.trim();
        const match = userId.match(/^\S+@\S+\.\S+$/);
        if (match) {
            const response = await this.props.callApi('PUT', `${this.props.baseUrl}/radar/${radarId}`, {
                permissions: [
                    {
                        user_id: userId,
                        rights: ['edit'],
                    },
                ],
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

    render() {
        const parent = this;
        const state = parent.state;
        if (this.props.permissions.createRadar) {
            return (
                <div className="new-radar-grid">
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
                </div>
            )
        } else {
            return (
                <div className="new-radar-grid">
                    <div className="new-radar border-top">You are not authorized to create a radar</div>
                </div>
            )
        }
    }
}

export default CreateRadar;