import React from 'react';
import './ButtonLegend.css';

class ButtonLegend extends React.Component {
    render() {
        return (
            <div className="button-legend">
                <div className="button-legend-row">
                    <div
                        class="bg-success float-left"
                        style={{
                            height: 15,
                            width: 15,
                        }} 
                    />
                    <label
                        className="text-success"
                        style={{
                            marginBottom: 0,
                        }}
                    >
                        Successful action
                    </label>
                </div>
                <div className="button-legend-row">
                    <div
                        class="bg-danger float-left"
                        style={{
                            height: 15,
                            width: 15,
                        }} 
                    />
                    <label
                        className="text-danger"
                        style={{
                            marginBottom: 0,
                        }}
                    >
                        Failed action
                    </label>
                </div>
                <div className="button-legend-row">
                    <a
                        href={process.env.REACT_APP_DESIGN_SYSTEM_URL}
                        target="_blank"
                    >
                        Design System
                    </a>
                </div>
            </div>
        );
    }
}

export default ButtonLegend;