import React from 'react';
import './Navbar.css';

class Navbar extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        authenticated: this.props.authenticated,
        userInfo: this.props.userInfo,
        permissions: this.props.permissions,
      };
    }

    handleUserInfo() {
      this.props.onUserInfoChange(this.state.userInfo, this.state.permissions, this.state.authenticated)
    }

    async getUserInfo() {
      const baseUrl = process.env.REACT_APP_IAM_SERVICE || process.env.REACT_APP_IAM_URL; 
      let response
      try {
        response = await this.props.callApi('GET', `${baseUrl}/userinfo`);
      } catch(e) {
        response = {
          ok: false,
        }
      }

      if (!response.ok) {
        console.error('Error when authenticating');
        window.localStorage.removeItem('access_token');
        this.state.userInfo = undefined;
        this.state.authenticated = false;
        this.state.permissions = {};
        this.handleUserInfo();
        return;
      }

      const userInfo = await response.json();
      this.state.userInfo = userInfo;
      this.state.authenticated = true;
      this.handleUserInfo();

      response = await this.props.callApi('GET', `${this.props.baseUrl}/permissions`);
      const permissions = await response.json();
      this.state.permissions.createRadar = permissions.create_radar;
      this.state.permissions.adminUser = permissions.admin_user;

      this.handleUserInfo();
    }

    async componentDidMount() {
      await this.getUserInfo();
    }

    render() {
        return <div className="border">
            <header className="navbar navbar-expand-xl">
                <div className="d-flex">
                    <a tabIndex="1" href="/" className="navbar-brand d-flex align-items-center">
                        <svg height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <g>
                                <rect fill="#e60028" width="32" height="16"/>
                                <rect fill="#000" y="16" width="32" height="16"/>
                                <rect fill="#fff" x="6" y="15" width="20" height="2"/>
                            </g>
                        </svg>
                    </a>

                </div>

                <div className="d-flex align-items-center order-xl-1">
                    <sgwt-account-center id="account-center" authentication="sg-connect-v2" available-languages="en"
                                         show-sign-in-button="true" mode="sg-markets" navigate-as="true"
                                         navigate-as-user="{&quot;name&quot;:&quot;SG staff&quot;}">
                      <span>
                        <div className="d-flex position-relative sgwt-account-center">
                          <div className="justify-content-end">
                              <ul className="navbar-nav mr-xl-auto">
                                  <li className="nav-item">
                                      <a tabIndex="2" className="nav-link" href="http://go/tsn-draft" target="_blank">TSN (draft)</a>
                                  </li>
                                  <li className="nav-item">
                                      <a tabIndex="3" className="nav-link" href="http://go/tsn" target="_blank">TSN</a>
                                  </li>
                              </ul>
                          </div>
                          <div className="d-flex position-relative align-items-stretch">
                            <button tabIndex="4"
                                    className="btn btn-flat-black btn-lg sgwt-account-center-user-info"
                                    aria-haspopup="true" aria-expanded="false" aria-label="My account">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="account-circle" className="icon"
                                  fill="currentColor" height="24" width="24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z"/>
                                <path d="M0 0h24v24H0z" fill="none"/>
                              </svg>
                            </button>
                          </div>
                          <div
                            className="text-left text-small ml-2 d-none d-md-block align-self-center sgwt-account-center-user-info"
                          >
                            {
                              this.state.userInfo ?
                              <div className="text-capitalize text-truncate sgwt-account-center-user">
                                {this.state.userInfo.first_name} {this.state.userInfo.last_name}
                              </div> : <div/>
                            }
                            {
                              this.state.authenticated ? <div />
                              :
                              <a
                                tabIndex="-1"
                                className="text-secondary"
                                style={{cursor: 'pointer'}}
                                href={this.props.signIn}
                              >
                                Sign in
                              </a>
                            }
                          </div>
                        </div>
                      </span>
                    </sgwt-account-center>
                    <svg className="d-none d-md-block overflow-visible ml-3" height="32" width="160">
                        <text x="0" y="16" fontSize="1.5em">SG</text>
                        <rect fill="#E60028" height="16" width="1.7" x="31.5" y="0"/>
                        <text fontWeight="bold" fontSize="1.5em" y="16" x="37">RESG/GTS</text>
                        <text className="font-family-display" x="0" y="32" height="16" width="160">
                            Technical Strategy Note
                        </text>
                    </svg>
                </div>

                <div className="navbar-collapse justify-content-end" id="navbar-default">
                    <ul className="navbar-nav mr-xl-auto">
                        <li className="nav-item">
                            <a tabIndex="3" className="nav-link" href="/radars">Radars</a>
                        </li>
                        <li className="nav-item">
                            <a tabIndex="4" className="nav-link" href="/blips">Blips</a>
                        </li>
                        {
                          process.env.REACT_APP_DOCS_URL ?
                          <li className="nav-item">
                            <a tabIndex="5" className="nav-link" href={process.env.REACT_APP_DOCS_URL} target="_blank">Docs</a>
                          </li> : null
                        }
                    </ul>
                </div>
            </header>
        </div>
    }
}

export default Navbar;