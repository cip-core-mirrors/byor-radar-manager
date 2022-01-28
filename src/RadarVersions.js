import React from 'react';
import {
    withRouter,
} from "react-router-dom";

import Spinner from './Spinner';
import './RadarVersions.css';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';

class RadarVersions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isFirstRefresh: true,
            isLoading: true,
            success1: undefined,
            success2: undefined,
            submitting: false,
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

    async loadRadarParameters() {
        const selectedVersion = this.state.selectedVersion;

        let url = `${this.props.baseUrl}/radar/${selectedVersion.radar}/${selectedVersion.version}/parameters`;

        const response = await this.props.callApi('GET', url);
        const data = await response.json();

        return data;
    }

    async loadRadarBlipLinks() {
        const selectedVersion = this.state.selectedVersion;

        let url = `${this.props.baseUrl}/radar/${selectedVersion.radar}/${selectedVersion.version}/blip-links`;

        const response = await this.props.callApi('GET', url);
        const data = await response.json();

        return data;
    }

    async deleteRadarVersion() {
        if (this.state.submitting) return;

        this.state.submitting = true;
        this.setState(this.state);

        const selectedVersion = this.state.selectedVersion;

        let url = `${this.props.baseUrl}/radar/${selectedVersion.radar}/versions/${selectedVersion.id}`;

        const response = await this.props.callApi('DELETE', url);
        this.state.success1 = response.ok;
        if (this.state.success1) {
            const index = this.state.versions.map(v => v.id).indexOf(selectedVersion.id);
            this.state.versions.splice(index, 1);
        }

        this.setState(this.state);
        
        const parent = this;
        setTimeout(() => {
            parent.state.success1 = undefined;
            parent.state.submitting = false;
            parent.setState(this.state);
        }, 5000);
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner />;

        const parent = this;

        let previewUrl;
        if (this.state.selectedVersion) {
            previewUrl = `${process.env.REACT_APP_RADAR_URL}?sheetId=${this.state.selectedVersion.radar}`;
            if (this.state.selectedVersion.version !== null) previewUrl += `&version=${this.state.selectedVersion.version}`;
            if (this.state.selectedVersion.fork !== null) previewUrl += `&fork=${this.state.selectedVersion.fork}`;
            if (this.state.selectedVersion.fork_version !== null) previewUrl += `&forkVersion=${this.state.selectedVersion.fork_version}`;
        }

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

                                const queryString = {};
                                queryString.version = parent.state.selectedVersion.version;
                                if (parent.state.selectedVersion.fork) {
                                    queryString.fork = parent.state.selectedVersion.fork;
                                    if (parent.state.selectedVersion.fork_version) {
                                        queryString.forkVersion = parent.state.selectedVersion.fork_version;
                                    }
                                }

                                parent.props.onRadarVersionChange(
                                    parent.state.selectedVersion.radar,
                                    parent.state.selectedVersion.version,
                                    parent.state.selectedVersion.fork,
                                    parent.state.selectedVersion.fork_version,
                                );

                                let url = `/radars/${parent.state.selectedVersion.radar}/edit`;
                                if (Object.keys(queryString).length > 0) url += `?${Object.entries(queryString).map(function (entry) {
                                    return `${entry[0]}=${entry[1]}`;
                                }).join('&')}`;
                                parent.state.editLink = url;
                                parent.setState(parent.state);
                            }}
                        >
                            {
                                parent.state.versions.map(version =>
                                    <option
                                        value={version.id}
                                        key={version.id}
                                    >
                                        {version.radar} - version {version.version} {
                                            version.fork !== null ? `(fork ${version.fork} - v${version.fork_version})` : ''
                                        }
                                    </option>
                                )
                            }
                        </select>
                        {
                            parent.state.selectedVersion !== undefined ?
                                <div
                                    className="radar-version-buttons"
                                    style={{
                                        marginTop: '1em',
                                    }}
                                >
                                    <Link
                                        to={parent.state.editLink}
                                    >
                                        <input
                                            readOnly
                                            value="Edit"
                                            className="submit-btn btn btn-lg btn-primary"
                                            style={{
                                                gridRow: 1,
                                                gridColumn: 1,
                                            }}
                                        />
                                    </Link>
                                    <input
                                        readOnly
                                        value="Delete"
                                        className={`submit-btn btn btn-lg ${this.state.success1 === undefined ? 'btn-primary' : (this.state.success1 ? 'btn-success' : 'btn-danger')}`}
                                        style={{
                                            gridRow: 1,
                                            gridColumn: 2,
                                        }}
                                        onClick={async function(e) {
                                            parent.deleteRadarVersion();
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
                            src={previewUrl}
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