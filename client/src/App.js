import React, { Suspense, lazy } from 'react';
import { Layout, Menu, Avatar, message, Dropdown, Modal } from 'antd';
import {
  FlagTwoTone,
  HomeTwoTone,
  FundTwoTone,
  UserOutlined,
  LogoutOutlined,
  CodeTwoTone,
  PlusSquareTwoTone,
  GithubOutlined,
  ExclamationCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import './App.min.css';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import UserChallengeCreate from "./userChallengeCreate.js";
import { Transition, animated } from 'react-spring';
import { Ellipsis } from 'react-spinners-css';


const { confirm } = Modal;
const { Content, Sider } = Layout;

const production = false
window.ipAddress = production ? "https://api.irscybersec.tk" : "http://localhost:20001"

const Home = lazy(() => import("./home.js"));
const Challenges = lazy(() => import("./challenges.js"));
const Profile = lazy(() => import("./profile.js"));
const Settings = lazy(() => import("./Settings.js"));
const Scoreboard = lazy(() => import("./Scoreboard.js"));
const Login = lazy(() => import("./login.js"));
const Admin = lazy(() => import("./admin.js"));
const Oops = lazy(() => import("./oops.js"));

var ctfxVersion = "0.8.5"


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: false,
      current: "",
      token: false,
      logined: false,
      username: "",
      permissions: 0,
      userScore: "Loading...",
      loading: true
    };
  }


  // sider handler (for opening and closing sider)
  onCollapse = collapsed => {
    this.setState({ collapsed });
  }

  componentDidUpdate(prevProps) {
    // Handle any page changes 
    if (this.props.location.pathname.split("/")[1] !== prevProps.location.pathname.split("/")[1]) {
      this.setState({ current: this.props.location.pathname.split("/")[1] })
    }
  }


  componentDidMount = async () => {
    message.config({ maxCount: 2 })
    // Handles "remember me" logins
    this.setState({ current: this.props.location.pathname.split("/")[1] })
    if (!this.state.token) {
      const token = localStorage.getItem("IRSCTF-token")
      const key = "login"

      if (token !== null) {
        message.loading({ content: "Attempting to restore session...", key, duration: 0 })
        // Get permissions from server
        await fetch(window.ipAddress + "/v1/account/type", {
          method: 'get',
          headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
          return results.json(); //return data in JSON (since its JSON data)
        }).then(async (data) => {
          if (data.success === true) {
            const username = token.split(".")[0]
            this.setState({ permissions: data.type, token: token, username: username, logined: true }, this.setState({ loading: false }))
            message.success({ content: "Session restored. Welcome back " + username, key, duration: 2.5 })

            this.obtainScore()
          }
          else {
            //Might be a fake token since server does not have it, exit
            this.setState({ token: false }, this.setState({ loading: false }))
            message.error({ content: "Oops. Failed to restore session, please login again", key, duration: 2.5 })
          }
        }).catch((error) => {
          message.error({ content: "Oops. There was an issue connecting to the server, please try again", key, duration: 2.5 });
          this.setState({ loading: false })
        })
      }
      else {
        this.setState({ loading: false })
      }
    }


  }

  // Callback function for Login component to set token and perms
  handleLogin(receivedToken, permissions, remember) {
    const username = receivedToken.split(".")[0]

    const store = async () => {
      if (remember === true) {
        await localStorage.setItem('IRSCTF-token', receivedToken)

      }
      else {
        await sessionStorage.setItem("IRSCTF-token", receivedToken)
      }

      await this.setState({ token: receivedToken, permissions: permissions, username: username, logined: true })
      message.success({ content: "Logged In! Welcome back " + username })
    }

    store()


  }

  handleLogout(close) {
    sessionStorage.removeItem("IRSCTF-token")
    localStorage.removeItem("IRSCTF-token")
    this.setState({ token: false, logined: false })
    message.info({ content: "Logged out. See you next time :D!" })
  }

  obtainScore() {
    fetch(window.ipAddress + "/v1/scores/" + localStorage.getItem("IRSCTF-token").split(".")[0], {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {

      if (data.success === true && data.score !== "hidden") {
        this.setState({ userScore: data.score })
      }
      else if (data.success === true) {
        this.setState({ userScore: "Hidden" })
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }


  render() {
    return (
      <div style={{ position: "fixed" }}>
        <Transition
          items={this.state.logined}
          native
          from={{ opacity: 0, transform: 'translate3d(50%,0,0)', position: "fixed" }}
          enter={{ opacity: 1, transform: 'translate3d(0%,0,0)', position: "static" }}
          leave={{ opacity: 0, position: "fixed" }}
        >
          {(styles, item) => {
            if (item && !this.state.loading) {
              return (
                <animated.div style={{ ...styles, width: "100vw", height: "100vh", backgroundImage: "url(" + require("./assets/mainBG.webp").default + ")", backgroundSize: "cover" }}>
                  <Layout style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}>
                    <Sider style={{ height: "100vh" }}>
                      <div style={{ height: "9ch", padding: "15px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                        <img alt="Sieberrsec Logo" src={require("./sieberrsec_ctf.svg").default} style={{ width: "100%", height: "100%", marginRight: "1vw" }}></img>
                      </div>
                      <Dropdown overlay={
                        <Menu>
                          <Menu.Item key="Profile">
                            <NavLink to="/Profile">
                              <span>Profile </span>
                              <UserOutlined />
                            </NavLink>
                          </Menu.Item>
                          <Menu.Item key="Settings">
                            <NavLink to="/Settings">
                              <span>Settings </span>
                              <SettingOutlined />
                            </NavLink>
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item key="logout" onClick={() => {
                            confirm({
                              title: 'Are you sure you want to logout?',
                              icon: <ExclamationCircleOutlined />,
                              onOk: (close) => { this.handleLogout(); close(); },
                              onCancel: () => { },
                            });
                          }}>
                            <span style={{ color: "#d32029" }}>Logout <LogoutOutlined /></span>
                          </Menu.Item>
                        </Menu>}
                        trigger={['click']}>
                        <div className="buttonHover"
                          style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", alignItems: "center", height: "13ch", cursor: "pointer", paddingLeft: "2ch", marginBottom: "2vh" }}>
                          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignContent: "center", alignItems: "center", marginBottom: "1vh" }}>
                            <h3 style={{ marginRight: "1vw", fontSize: "2.3ch" }}>{this.state.username}</h3>
                            <Avatar size="large" src={require("./assets/profile.webp").default} />
                          </div>
                          <div>
                            <h3 style={{ color: "#d89614", fontSize: "2.3ch" }}><b>Score:</b> {this.state.userScore}</h3>
                          </div>
                        </div>
                      </Dropdown>

                      <Menu
                        selectedKeys={[this.state.current]}
                        onSelect={(selection) => { this.setState({ current: selection.key }); this.obtainScore() }}
                        //defaultOpenKeys={['']}
                        mode="inline"
                        theme="dark"

                      > {/*
        defaultSelectedKeys - default selected menu items
        defaultOpenKeys - default opened sub menus
        inline - Sidebar Menu

        */}



                        <Menu.Item key="" className="menu-item">
                          <NavLink to="/">
                            <HomeTwoTone className="menu-item-icon" />
                            <span>Home</span>
                          </NavLink>
                        </Menu.Item>

                        <Menu.Item key="Challenges" className="menu-item">
                          <NavLink to="/Challenges">
                            <FlagTwoTone className="menu-item-icon" />
                            <span>Challenges</span>
                          </NavLink>
                        </Menu.Item>

                        <Menu.Item key="Scoreboard" className="menu-item">
                          <NavLink to="/Scoreboard">
                            <FundTwoTone className="menu-item-icon" />
                            <span>Scoreboard</span>
                          </NavLink>
                        </Menu.Item>

                        <Menu.Divider />

                        {this.state.permissions === 1 && (
                          <Menu.Item key="CreateChallenge" className="menu-item">
                            <NavLink to="/CreateChallenge">
                              <PlusSquareTwoTone className="menu-item-icon" twoToneColor="#d89614" />
                              <span>Create Challenge</span>
                            </NavLink>
                          </Menu.Item>
                        )}

                        {this.state.permissions === 2 && (

                          <Menu.Item key="Admin" className="menu-item">
                            <NavLink to="/Admin">
                              <CodeTwoTone className="menu-item-icon" twoToneColor="#d32029" />
                              <span>Admin Panel</span>
                            </NavLink>
                          </Menu.Item>
                        )}


                      </Menu>
                      <div style={{ textAlign: "center", marginTop: "3ch", color: "#8c8c8c" }}>
                        <p>Sieberrsec CTF Platform {ctfxVersion} <a href="https://github.com/IRS-Cybersec/ctf_platform" target="_blank">Contribute <GithubOutlined /></a></p>
                      </div>
                    </Sider>

                    <Content style={{ height: "100vh", position: "static", overflow: "hidden", margin: "30px" }}>
                      <Route
                        render={({ location, ...rest }) => (
                          <Transition
                            native
                            items={location.pathname.split("/")[1]}
                            trail={5}
                            key={location.pathname.split("/")[1]}
                            from={{ opacity: 0 }}
                            enter={{ opacity: 1 }}
                            leave={{ opacity: 0, display: "none" }}>
                            {(style, loc) => (
                              <animated.div style={{ ...style, height: "95vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
                                <Suspense fallback={<div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 15 }}>
                                  <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                                </div>}>
                                  <Switch>
                                    <Route exact path='/' render={(props) => <Home {...props} transition={style} />} />
                                    <Route path='/Challenges/:category?/:challenge?' render={(props) => <Challenges {...props} transition={style} obtainScore={this.obtainScore.bind(this)} />} />
                                    <Route exact path='/Scoreboard' render={(props) => <Scoreboard {...props} transition={style} />} />

                                    <Route exact path='/Profile' render={(props) => <Profile {...props} transition={style} username={this.state.username} key={window.location.pathname} />} />
                                    <Route exact path='/Settings' render={(props) => <Settings {...props} transition={style} username={this.state.username} key={window.location.pathname} />} />
                                    <Route exact path='/Profile/:user' render={(props) => <Profile {...props} transition={style} username={this.state.username} key={window.location.pathname} />} />


                                    {this.state.permissions >= 1 ? (
                                      <Route exact path='/CreateChallenge' render={(props) => <UserChallengeCreate {...props} transition={style} />} />
                                    ) : (
                                      <Route path='/Oops' render={(props) => { <Oops {...props} transition={style} /> }} />
                                    )}

                                    {this.state.permissions === 2 ? (
                                      <Route path={['/Admin/:tabPane?']} render={(props) => <Admin {...props} transition={style} />} />
                                    ) : (
                                      <Route path='/Oops' render={(props) => <Oops {...props} transition={style} />} />
                                    )}
                                    <Route path='/*' render={(props) => <Oops {...props} transition={style} />} />

                                  </Switch>
                                </Suspense>
                              </animated.div>

                            )}
                          </Transition>
                        )}
                      />

                    </Content>
                  </Layout>
                </animated.div>
              )
            }
            else {

              if (!this.state.loading && !item && !this.state.token) {
                return (
                  <animated.div style={{ ...styles, position: "absolute" }}>
                    <Suspense fallback={<div className="loading-style">
                      <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>}>
                      <Login handleLogin={this.handleLogin.bind(this)}></Login>
                    </Suspense>
                  </animated.div>)
              }
              else {
                return (
                  <animated.div style={{ ...styles, position: "absolute", height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.95)" }}>
                    <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                  </animated.div>
                )
              }

            }
          }
          }
        </Transition>
      </div >
    );
  }
}

export default withRouter(App);
