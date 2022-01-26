import React from 'react';
import {
    withRouter,
} from "react-router-dom";

import Spinner from './Spinner';
import './Parameters.css';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';

class RadarVersions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isFirstRefresh: true,
            isLoading: true,
            radarId: this.props.match.params.radarId,
            versions: [],
            selectedVersion: undefined,
            editLink: undefined,
        };
    }

    async componentDidMount() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn) {
                this.firstRefresh();
            }
        }
    }
 

    async componentDidUpdate() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn) {
                this.firstRefresh();
            }
        }
    }

    async firstRefresh() {
        this.state.isFirstRefresh = false;
        this.setState(this.state);

        await this.loadVersions();

        this.state.isLoading = false;
        this.setState(this.state);
    }

    async loadVersions() {
        const versions = await (await this.props.callApi('GET', `${this.props.baseUrl}/radar/${this.state.radarId}`)).json();
        versions.sort(function (a, b) {
            if (a.version < b.version) return -1;
            else if (a.version > b.version) return 1;

            if (a.fork < b.fork) return -1;
            else if (a.fork > b.fork) return 1;

            if (a.fork_version < b.fork_version) return -1;
            else if (a.fork_version > b.fork_version) return 1;

            return 0;
        });

        this.state.versions = versions;
        this.setState(this.state);
    }

    handleVersionChange() {
        const selectedVersion = this.state.selectedVersion;
        this.props.onRadarVersionChange(selectedVersion.radar, selectedVersion.version, selectedVersion.fork, selectedVersion.fork_version);
    }

    async loadParameters() {
        const selectedVersion = this.state.selectedVersion;
        
        let url = `${this.props.baseUrl}/radar/${selectedVersion.radar}/${selectedVersion.version}/parameters`;

        const response = await this.props.callApi('GET', url);
        const data = await response.json();

        return data;
    }

    async fork() {
        const parameters = await this.loadParameters();
        //console.log(parameters);
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner />;

        const parent = this;

        return <div
            className="theme-grid"
        >
            <h3>Radar versions</h3>
            <div className="themes-metadata">
                <div className="themes-metadata-left">
                    <div className="themes-select">
                        <div className="font-weight-bold text-secondary">
                            Select a version to preview it
                        </div>
                        <select
                            className="custom-select"
                            size="4"
                            onClick={async function (e) {
                                const target = e.target;
                                if (target.tagName !== 'OPTION') return;
                                if (parent.state.selectedVersion !== undefined && parent.state.selectedVersion.id === target.value) return;

                                const versionId = target.value;

                                parent.state.selectedVersion = parent.state.versions.filter(version => version.id === versionId)[0];

                                let queryString = '';
                                if (parent.state.selectedVersion.fork) {
                                    queryString += `?fork=${parent.state.selectedVersion.fork}`;
                                    if (parent.state.selectedVersion.fork_version) {
                                        queryString += `&forkVersion=${parent.state.selectedVersion.fork_version}`;
                                    }
                                }

                                parent.handleVersionChange();

                                parent.state.editLink = `/radars/${parent.state.radarId}/versions/${parent.state.selectedVersion.id}${queryString}`;
                                parent.setState(parent.state);
                            }}
                        >
                            {
                                parent.state.versions.map(version =>
                                    <option
                                        value={version.id}
                                        key={version.id}
                                    >
                                        {version.radar} - v{version.version} {
                                            version.fork !== null ? `(fork ${version.fork} - version ${version.fork_version})` : ''
                                        }
                                    </option>
                                )
                            }
                        </select>
                        {
                            parent.state.selectedVersion !== undefined ?
                                <div
                                    className="radar-version-buttons"
                                >
                                    <Link
                                        to={parent.state.editLink}
                                    >
                                        <input
                                            readOnly
                                            value="Edit"
                                            className="submit-btn btn btn-lg btn-primary"
                                        />
                                    </Link>
                                    <input
                                        readOnly
                                        value="Fork"
                                        className="submit-btn btn btn-lg btn-primary"
                                        onClick={function(e) {
                                            parent.fork();
                                        }}
                                    />
                                </div>
                            : null
                        }
                    </div>
                </div>
                {
                    this.state.selectedVersion ?
                        <iframe
                            id="radar-preview"
                            src={`${process.env.REACT_APP_RADAR_URL}?sheetId=markdown&version=${this.state.selectedVersion}`}
                            style={{
                                border: "none",
                                marginTop: "1em",
                            }}
                            width="100%" height="890"
                            onload='javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+"px";}(this));'
                        /> : null
                }
            </div>
        </div>
    }
}

export default withRouter(RadarVersions);