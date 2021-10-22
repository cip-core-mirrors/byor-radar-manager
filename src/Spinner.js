import React from 'react';

class Spinner extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div
            className="spinner-grow"
            role="status"
            style={{
                justifySelf: "center",
            }}
        >
            Loading...
        </div>
    }
}

export default Spinner;