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
            success3: undefined,
            submitting: false,
            radarId: this.props.match.params.radarId,
            versions: [],
            tags: [],
            selectedVersion: undefined,
            selectedTag: undefined,
            tagName: undefined,
            previewUrl: undefined,
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
        await this.loadTags();

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

    async loadTags() {
        const tags = await (await this.props.callApi('GET', `${this.props.baseUrl}/radar/${this.state.radarId}/tags`)).json();

        for (const tag of tags) {
            const versionId = tag.radar_version;
            for (const radarVersion of this.state.versions) {
                if (radarVersion.id === versionId) {
                    tag.version = radarVersion.version;
                    tag.fork = radarVersion.fork;
                    tag.fork_version = radarVersion.fork_version;
                }
            }
        }
        
        this.state.tags = tags;
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
            this.state.selectedVersion = undefined;
        }

        this.setState(this.state);
        
        const parent = this;
        setTimeout(() => {
            parent.state.success1 = undefined;
            parent.state.submitting = false;
            parent.setState(this.state);
        }, 5000);
    }

    async createTag() {
        if (this.state.submitting) return;

        this.state.submitting = true;
        this.setState(this.state);

        const selectedVersion = this.state.selectedVersion;
        const tagName = this.state.tagName;

        const url = `${this.props.baseUrl}/radar/${selectedVersion.radar}/tags`;
        const body = {
            name: tagName,
            version: selectedVersion.version,
            fork: selectedVersion.fork,
            forkVersion: selectedVersion.fork_version,
        };

        const response = await this.props.callApi('POST', url, body);
        this.state.success3 = response.ok;

        if (this.state.success3) {
            let radarVersionId = `${selectedVersion.radar}-${selectedVersion.version}`;
            if (selectedVersion.fork !== undefined && selectedVersion.fork !== null) radarVersionId += `-${selectedVersion.fork}`;
            if (selectedVersion.fork_version !== undefined && selectedVersion.fork_version !== null) radarVersionId += `-${selectedVersion.fork_version}`;

            const index = this.state.tags.map(t => t.name).indexOf(tagName);
            this.state.tags.splice(index, 1);

            this.state.tags.push({
                id: `${selectedVersion.radar}-${tagName}`,
                name: tagName,
                radar: selectedVersion.radar,
                version: selectedVersion.version,
                radar_version: radarVersionId,
                fork: selectedVersion.fork,
                fork_version: selectedVersion.fork_version,
            });
        }
        this.setState(this.state);
        
        const parent = this;
        setTimeout(() => {
            parent.state.success3 = undefined;
            parent.state.submitting = false;
            parent.setState(this.state);
        }, 5000);
    }

    async deleteTag() {
        if (this.state.submitting) return;

        this.state.submitting = true;
        this.setState(this.state);

        const tagName = this.state.selectedTag;

        const url = `${this.props.baseUrl}/radar/${this.state.radarId}/tags/${tagName}`;

        const response = await this.props.callApi('DELETE', url);
        this.state.success4 = response.ok;
        if (this.state.success4) {
            const index = this.state.tags.map(t => t.name).indexOf(tagName);
            this.state.tags.splice(index, 1);
            this.state.selectedTag = undefined;
        }

        this.setState(this.state);
        
        const parent = this;
        setTimeout(() => {
            parent.state.success4 = undefined;
            parent.state.submitting = false;
            parent.setState(this.state);
        }, 5000);
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner />;

        const parent = this;

        if (this.state.selectedVersion) {
            this.state.previewUrl = `${process.env.REACT_APP_RADAR_URL}?sheetId=${this.state.radarId}`;
            if (this.state.selectedVersion.version !== null) this.state.previewUrl += `&version=${this.state.selectedVersion.version}`;
            if (this.state.selectedVersion.fork !== null) this.state.previewUrl += `&fork=${this.state.selectedVersion.fork}`;
            if (this.state.selectedVersion.fork_version !== null) this.state.previewUrl += `&forkVersion=${this.state.selectedVersion.fork_version}`;
        } else if (this.state.selectedTag) {
            this.state.previewUrl = `${process.env.REACT_APP_RADAR_URL}?sheetId=${this.state.radarId}`;
            this.state.previewUrl += `&tag=${this.state.selectedTag}`;
        } else {
            this.state.previewUrl = undefined;
        }

        return <div
            className="theme-grid"
        >
            <h3>Radar versions</h3>
            <div className="themes-metadata">
                <div className="themes-metadata-left">
                    <div className="radar-versions-select">
                        <div className="radar-versions-table">
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
                                    parent.state.selectedTag = undefined;

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
                                            Version {version.version} {
                                                version.fork !== null ? `- Fork ${version.fork} (v${version.fork_version})` : ''
                                            }
                                        </option>
                                    )
                                }
                            </select>
                        </div>
                        {
                            parent.state.selectedVersion !== undefined ?
                                <div
                                    className="radar-version-buttons-grid"
                                >
                                    <div className="radar-version-buttons">
                                        <Link
                                            to={parent.state.editLink}
                                        >
                                            <input
                                                readOnly
                                                value="Edit"
                                                className="small-btn submit-btn btn btn-lg btn-primary"
                                                style={{
                                                    gridRow: 1,
                                                    gridColumn: 1,
                                                }}
                                            />
                                        </Link>
                                        <input
                                            readOnly
                                            value="Delete"
                                            className={`small-btn submit-btn btn btn-lg ${this.state.success1 === undefined ? 'btn-primary' : (this.state.success1 ? 'btn-success' : 'btn-danger')}`}
                                            style={{
                                                gridRow: 1,
                                                gridColumn: 2,
                                            }}
                                            onClick={async function(e) {
                                                parent.deleteRadarVersion();
                                            }}
                                        />
                                    </div>
                                    <div className="create-tag">
                                        <label
                                            className="paramName"
                                            style={{
                                                marginBottom: 0,
                                            }}
                                        >
                                            Tag name &nbsp;
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-alt"
                                            id={this.state.createId}
                                            onChange={function(e) {
                                                parent.state.tagName = e.target.value;
                                            }}
                                            onKeyDown={async function(e) {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    await parent.createTag();
                                                }
                                            }}
                                        />
                                        <input
                                            readOnly
                                            value="Create tag"
                                            className={`small-btn submit-btn btn btn-lg ${this.state.success3 === undefined ? 'btn-primary' : (this.state.success3 ? 'btn-success' : 'btn-danger')}`}
                                            onClick={function(e) {
                                                parent.createTag();
                                            }}
                                        />
                                    </div>
                                </div> : null
                        }
                        <div
                            className="radar-tags"
                        >
                            <div className="font-weight-bold text-secondary">
                                Tags
                            </div>
                            <select
                                className="custom-select"
                                size="4"
                                onClick={async function(e) {
                                    const target = e.target;
                                    if (target.tagName !== 'OPTION') return;
                                    if (target.value === parent.state.selectedTag) return;

                                    parent.state.selectedVersion = undefined;
                                    parent.state.selectedTag = target.value;
                                    parent.setState(parent.state);
                                }}
                            >
                                {
                                    parent.state.tags.map(tag =>
                                        <option
                                            value={tag.name}
                                            key={tag.name}
                                        >
                                            {tag.name} - version {tag.version} {
                                                tag.fork !== null ? `(fork ${tag.fork} - v${tag.fork_version})` : ''
                                            }
                                        </option>
                                    )
                                }
                            </select>
                            {
                                this.state.selectedTag ?
                                    <input
                                        readOnly
                                        value="Delete"
                                        className={`small-btn submit-btn btn btn-lg ${this.state.success4 === undefined ? 'btn-primary' : (this.state.success4 ? 'btn-success' : 'btn-danger')}`}
                                        onClick={async function(e) {
                                            parent.deleteTag();
                                        }}
                                    />
                                : null
                            }
                        </div>
                    </div>
                </div>
                {
                    this.state.previewUrl ?
                        <iframe
                            id="radar-preview"
                            src={this.state.previewUrl}
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