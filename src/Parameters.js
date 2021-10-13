import React from 'react';
import './Parameters.css';

class Parameters extends React.Component {

    handleChange = (parameters) => {
        this.props.onParamsChange(parameters)
    }

    async componentDidMount() {
        const parameters = await (await this.props.callApi('GET', `${this.props.baseUrl}/parameters`)).json();

        const radarId = this.props.radarId;
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/radar/${radarId}/parameters`);
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

    render() {
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

        const handleChange = this.handleChange

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
                                            name={param.name}
                                            id={param.name}
                                            defaultChecked={(param.value || param.defaultValue) === '1'}
                                            onClick={function(e) {
                                                param.value = param.value === '1' ? '0' : '1';
                                                handleChange(parameters);
                                            }}
                                        />
                                        <label className="paramName custom-control-label" htmlFor={param.name}>{param.name}&nbsp;</label>
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
                                    <label className="paramName">{param.name}&nbsp;</label>
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
                                            handleChange(parameters);
                                        }}
                                    />
                                    <div className="dangerousInnerHTML border-bottom border-top border-left border-right" dangerouslySetInnerHTML={{
                                        __html: param.value,
                                    }} />
                                </div>
                            )
                        }
                        return (
                            <div className="form-group" key={param.name}>
                                <label className="paramName">{param.name}&nbsp;</label>
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
                                        handleChange(parameters);
                                    }}
                                />
                            </div>
                        )
                    } else {
                        const fieldParams = fieldSets[param.name];
                        return (
                            <fieldset key={param.name}>
                                <legend>{param.name}</legend>
                                {fieldParams.map(function(fParam) {
                                    return (
                                        <div className="form-group" key={fParam.name}>
                                            <label className="paramName">{fParam.name}</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-alt"
                                                id={fParam.name}
                                                defaultValue={fParam.value || (fParam.default || "")}
                                                onChange={function(e) {
                                                    fParam.value = e.target.value
                                                    handleChange(parameters);
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

export default Parameters;