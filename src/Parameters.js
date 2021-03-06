import React from 'react';
import {
    withRouter,
} from "react-router-dom";

import Spinner from './Spinner';
import './Parameters.css';

class Parameters extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isFirstRefresh: true,
            isLoading: true,
            themes: [],
        };
    }

    handleChange = (parameters) => {
        this.props.onParamsChange(parameters)
    }

    async componentDidMount() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn) {
                this.firstRefresh();
            }
        }
    }

    async firstRefresh() {
        this.state.isFirstRefresh = false;
        this.setState(this.state);

        await this.loadThemes();
        await this.loadParameters();

        this.props.onParamsLoaded(true);

        this.state.isLoading = false;
        this.setState(this.state);
    }

    async loadParameters() {
        const parameters = await (await this.props.callApi('GET', `${this.props.baseUrl}/parameters`)).json();

        const radarId = this.props.match.params.radarId;

        const queryString = new URLSearchParams(this.props.location.search);
        const radarVersion = queryString.get('version');
        const fork = queryString.get('fork');
        const forkVersion = queryString.get('forkVersion');

        let url = `${this.props.baseUrl}/radar/${radarId}/${radarVersion}/parameters`;
        if (fork !== undefined && fork !== null) url += `?fork=${fork}`;
        if (forkVersion !== undefined && forkVersion !== null) url += `&forkVersion=${forkVersion}`;

        const response = await this.props.callApi('GET', url);
        const data = await response.json();
        for (const p1 of data) {
            for (const p2 of parameters) {
                if (p1.name === p2.name) {
                    if (p1.value !== undefined) {
                        p2.value = p1.value;
                    }
                    break;
                }
            }
        }

        this.handleChange(parameters);
    }

    async loadThemes() {
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/themes`);
        const json = await response.json();
        json.sort(function(a, b) {
            if (a.id < b.id) return -1;
            else if (a.id > b.id) return 1;
            return 0;
        });
        this.state.themes = json;
    }

    async componentDidUpdate() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn) {
                this.firstRefresh();
            }
        }
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner/>;

        const params = [];
        const fieldSets = {};
        const parameters = this.props.parameters;
        for (const param of parameters) {
            if (param.fieldset) {
                let fieldSet = fieldSets[param.fieldset];
                if (!fieldSet) {
                    fieldSet = [];
                    fieldSets[param.fieldset] = fieldSet;
                    params.push({
                        paramType: 'fieldset',
                        name: param.fieldset,
                    });
                }
                fieldSet.push(param)
            } else {
                param.paramType = 'param';
                params.push(param)
            }
        }

        const uniqueThemes = [];
        const themeIdsSeen = {};
        for (const theme of (this.state.themes || [])) {
            const seen = themeIdsSeen[theme.id];
            if (seen) continue;
            themeIdsSeen[theme.id] = true;
            uniqueThemes.push(theme);
        }

        const parent = this;

        return (
            <form className="parameters">
                {params.map(function(param) {
                    if (param.paramType === 'param') {
                        if (param.type === 'boolean') {
                            return (
                                <div className="form-group" key={param.name}>
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            name={param.displayName || param.name}
                                            id={param.name}
                                            defaultChecked={(param.value || param.defaultValue) === '1'}
                                            onClick={function(e) {
                                                param.value = param.value === '1' ? '0' : '1';
                                                parent.handleChange(parameters);
                                            }}
                                        />
                                        <label className="paramName custom-control-label" htmlFor={param.name}>{param.displayName || param.name}&nbsp;</label>
                                        {
                                            param.tooltip ?
                                                <span className="help-tooltip">
                                                    <i className="icon icon-md">help_outline</i>
                                                    <div className="tooltip bs-tooltip-top" role="tooltip">
                                                        <div className="tooltip-inner">{param.tooltip}</div>
                                                    </div>
                                                </span>
                                            : <span className="help-tooltip"/>
                                        }
                                    </div>
                                </div>
                            )
                        } else if (param.name === 'titlePageHTML') {
                            return (
                                <div className="form-group" key={param.name}>
                                    <label className="paramName">{param.displayName || param.name}&nbsp;</label>
                                    {
                                        param.tooltip ?
                                            <span className="help-tooltip">
                                                <i className="icon icon-md">help_outline</i>
                                                <div className="tooltip bs-tooltip-top" role="tooltip">
                                                    <div className="tooltip-inner">{param.tooltip}</div>
                                                </div>
                                            </span>
                                        : <span className="help-tooltip"/>
                                    }
                                    <textarea
                                        className="form-control form-control-lg"
                                        id={param.name}
                                        rows="5"
                                        style={{
                                            marginBottom: '1em',
                                        }}
                                        defaultValue={param.value || (param.default || "")}
                                        onChange={function(e) {
                                            param.value = e.target.value
                                            parent.handleChange(parameters);
                                        }}
                                    />
                                    <div className="dangerousInnerHTML border-bottom border-top border-left border-right" dangerouslySetInnerHTML={{
                                        __html: param.value,
                                    }} />
                                </div>
                            )
                        } else if (param.name === 'themeId') {
                            return (
                                <div className="form-group" key={param.name}>
                                    <label className="paramName">{param.displayName || param.name}&nbsp;</label>
                                    {
                                        param.tooltip ?
                                            <span className="help-tooltip">
                                                <i className="icon icon-md">help_outline</i>
                                                <div className="tooltip bs-tooltip-top" role="tooltip">
                                                    <div className="tooltip-inner">{param.tooltip}</div>
                                                </div>
                                            </span>
                                        : <span className="help-tooltip"/>
                                    }
                                    <select
                                        className="custom-select"
                                        onClick={async function(e) {
                                            const target = e.target;
                                            if (target.tagName !== 'SELECT') return;
                                            param.value = target.value;
                                        }}
                                        defaultValue={param.value || param.default}
                                    >
                                        {
                                            uniqueThemes.map(theme => 
                                                <option
                                                    value={theme.id}
                                                    key={theme.id}
                                                >
                                                    {theme.id}
                                                </option>
                                            )
                                        }
                                    </select>
                                </div>
                            )
                        }
                        return (
                            <div className="form-group" key={param.name}>
                                <label className="paramName">{param.displayName || param.name}&nbsp;</label>
                                {
                                    param.tooltip ?
                                        <span className="help-tooltip">
                                            <i className="icon icon-md">help_outline</i>
                                            <div className="tooltip bs-tooltip-top" role="tooltip">
                                                <div className="tooltip-inner">{param.tooltip}</div>
                                            </div>
                                        </span>
                                    : <span className="help-tooltip"/>
                                }
                                <input
                                    type="text"
                                    className="form-control form-control-alt"
                                    id={param.name}
                                    defaultValue={param.value || (param.default || "")}
                                    onChange={function(e) {
                                        param.value = e.target.value
                                        parent.handleChange(parameters);
                                    }}
                                />
                            </div>
                        )
                    } else {
                        const fieldParams = fieldSets[param.name];
                        if (param.name === 'Order') return null; // Disable "Order" fieldset

                        return (
                            <fieldset key={param.name}>
                                <legend>{param.name}</legend>
                                {fieldParams.map(function(fParam) {
                                    return (
                                        <div className="form-group" key={fParam.name}>
                                            <label className="paramName">{fParam.displayName || fParam.name}</label>
                                            {
                                                fParam.tooltip ?
                                                    <span className="help-tooltip">
                                                        <i className="icon icon-md">help_outline</i>
                                                        <div className="tooltip bs-tooltip-top" role="tooltip">
                                                            <div className="tooltip-inner">{fParam.tooltip}</div>
                                                        </div>
                                                    </span>
                                                : <span className="help-tooltip"/>
                                            }
                                            <input
                                                type="text"
                                                className="form-control form-control-alt"
                                                id={fParam.name}
                                                defaultValue={fParam.value || (fParam.default || "")}
                                                onChange={function(e) {
                                                    fParam.value = e.target.value
                                                    parent.handleChange(parameters);
                                                }}
                                            />
                                        </div>
                                    )
                                })}
                            </fieldset>
                        )
                    }
                })}
            </form>
      );
    }
}

export default withRouter(Parameters);