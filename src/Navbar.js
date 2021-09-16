import React from 'react';
import './Navbar.css';

class Navbar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className="border">
            <header className="navbar navbar-expand-xl">
                <div className="d-flex">
                    <a tabIndex="1" href="#" className="navbar-brand d-flex align-items-center">
                        <svg height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <g>
                                <rect fill="#e60028" width="32" height="16"/>
                                <rect fill="#000" y="16" width="32" height="16"/>
                                <rect fill="#fff" x="6" y="15" width="20" height="2"/>
                            </g>
                        </svg>
                    </a>

                    <button tabIndex="2" className="navbar-toggler" type="button" data-toggle="collapse"
                            data-target="#navbar-default" aria-controls="navbar-default" aria-expanded="false"
                            aria-label="Toggle navigation">
                        Menu <em className="icon">arrow_drop_down</em>
                    </button>
                </div>

                <div className="d-flex align-items-center order-xl-1">
                    <sgwt-account-center id="account-center" authentication="sg-connect-v2" available-languages="en"
                                         show-sign-in-button="true" mode="sg-markets" navigate-as="true"
                                         navigate-as-user="{&quot;name&quot;:&quot;SG staff&quot;}"><span>
                <div className="d-flex position-relative sgwt-account-center">
                  <div className="position-relative">
                    <button tabIndex="4" className="btn btn-flat-black btn-lg" aria-haspopup="true"
                            aria-label="Notifications" data-toggle="dropdown">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="notifications" className="icon"
                           fill="currentColor" height="24" width="24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                        <path d="M0 0h24v24H0z" fill="none"/>
                      </svg>
                    </button>
                  </div>
                  <div className="d-flex position-relative align-items-stretch">
                    <button tabIndex="4" className="btn btn-flat-black btn-lg sgwt-account-center-my-services"
                            title="My services" aria-label="My services link">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="apps" className="icon"
                           fill="currentColor" height="24" width="24">
                        <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
                        <path d="M0 0h24v24H0z" fill="none"/>
                      </svg></button><button tabIndex="4"
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
                      className="text-left text-small ml-2 d-none d-md-block align-self-center sgwt-account-center-user-info">
                    <div className="text-capitalize text-truncate sgwt-account-center-user">
                      fabien zibi
                    </div>
                    <a tabIndex="-1" className="text-secondary" style={{cursor: 'pointer'}}>Sign out</a>
                  </div>
                  <div className="sgwt-account-center-tags">
                    <div
                        className="btn-group btn-group-sm sgwt-account-center-tag sgwt-account-center-navigation-as-tag mb-2">
                      <button className="btn btn-info btn-sm px-0">
                        <em className="sgwt-widgets-icon icon-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="close" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            <path d="M0 0h24v24H0z" fill="none"/>
                          </svg>
                        </em></button><button type="button"
                                              className="btn btn-info dropdown-toggle dropdown-toggle-split px-1">
                        <span className="mr-1">Navigate as SG staff</span><span
                        className="sr-only">Toggle Dropdown</span>
                      </button>
                    </div>
                  </div>
                </div>
              </span></sgwt-account-center>
                    <svg className="d-none d-md-block overflow-visible ml-3" height="32" width="160">
                        <text x="0" y="16" fontSize="1.5em">SG</text>
                        <rect fill="#E60028" height="16" width="1.7" x="31.5" y="0"/>
                        <text fontWeight="bold" fontSize="1.5em" y="16" x="37">MARKETS</text>
                        <text className="font-family-display" x="0" y="32" height="16" width="160">
                            Technical Strategy Note
                        </text>
                    </svg>
                </div>

                <div className="collapse navbar-collapse justify-content-end" id="navbar-default">
                    <ul className="navbar-nav mr-xl-auto">
                        <li className="nav-item">
                            <a tabIndex="3" className="nav-link" href="#"> Markets </a>
                        </li>
                        <li className="nav-item active">
                            <a tabIndex="3" className="nav-link" href="#">
                                Financing <span className="sr-only">(current)</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a tabIndex="3" className="nav-link" href="#">
                                Cash management
                            </a>
                        </li>
                        <li className="nav-item">
                            <a tabIndex="3" className="nav-link" href="#"> Securities </a>
                        </li>
                    </ul>
                </div>
            </header>
        </div>
    }
}

export default Navbar;