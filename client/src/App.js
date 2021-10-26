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
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import './App.min.css';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import { Transition, animated } from 'react-spring';
import { Ellipsis } from 'react-spinners-css';


const { confirm } = Modal;
const { Content, Sider } = Layout;


const Home = lazy(() => import("./Misc/home.js"));
const Challenges = lazy(() => import("./Challenges/challenges.js"));
const Profile = lazy(() => import("./SidebarDropdown/profile.js"));
const Teams = lazy(() => import("./SidebarDropdown/Teams.js"));
const Settings = lazy(() => import("./SidebarDropdown/Settings.js"));
const Scoreboard = lazy(() => import("./Scoreboard/Scoreboard.js"));
const Login = lazy(() => import("./Login/login.js"));
const Admin = lazy(() => import("./AdminPanel/admin.js"));
const Oops = lazy(() => import("./Misc/oops.js"));
const UserChallengeCreate = lazy(() => import("./Misc/userChallengeCreate.js"));

window.ipAddress = process.env.NODE_ENV === "development" ? "http://localhost:20001" : window.location.origin + "/api"
var ctfxVersion = "1.1"

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
      loading: true,
      mobileBreakpoint: false,
      scoreboardSocket: false,
      team: "loading"
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
      if (prevProps.location.pathname.split("/")[1] === "Scoreboard") {
        const webSocket = this.state.scoreboardSocket
        if (webSocket !== false && webSocket.readyState !== 3) {
          console.log("closed")
          webSocket.close(1000)
          this.setState({ scoreboardSocket: false })
        }

      }
    }
  }


  componentDidMount = async () => {
    message.config({ maxCount: 2 })

    // Handles "remember me" logins
    this.setState({ current: this.props.location.pathname.split("/")[1] })
    if (!this.state.token) {
      let token = localStorage.getItem("IRSCTF-token")
      if (token === null) token = sessionStorage.getItem("IRSCTF-token")
      const key = "login"

      if (token !== null) {
        window.IRSCTFToken = token
        message.loading({ content: "Attempting to restore session...", key, duration: 0 })
        // Get permissions from server
        fetch(window.ipAddress + "/v1/account/type", {
          method: 'get',
          headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
          return results.json(); //return data in JSON (since its JSON data)
        }).then(async (data) => {
          if (data.success === true) {
            const username = token.split(".")[0]
            this.setState({ permissions: data.type, token: token, username: username, logined: true }, this.setState({ loading: false }))
            message.success({ content: "Session restored. Welcome back " + username, key, duration: 2.5 })

            this.obtainScore(username)
            this.obtainTeam()
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

  obtainTeam = () => {
    fetch(window.ipAddress + "/v1/team/userTeam", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      if (data.success === true) {
        this.setState({ team: data.team })
      }
      else this.setState({ team: "teams-disabled" })
    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  setTeam = (team) => {
    this.setState({ team: team })
  }

  // Callback function for Login component to set token and perms
  handleLogin = (receivedToken, permissions, remember) => {
    const username = receivedToken.split(".")[0]
    if (remember === true) localStorage.setItem('IRSCTF-token', receivedToken)
    else sessionStorage.setItem("IRSCTF-token", receivedToken)
    window.IRSCTFToken = receivedToken

    this.setState({ token: receivedToken, permissions: permissions, username: username, logined: true })
    message.success({ content: "Logged In! Welcome back " + username })

    this.obtainScore(username)
    this.obtainTeam()
  }

  handleLogout = async (close) => {
    sessionStorage.removeItem("IRSCTF-token")
    delete window.scoreboardData
    delete window.lastChallengeID
    localStorage.removeItem("IRSCTF-token")
    this.setState({ token: false, logined: false, team: false, userScore: "Loading..." })

    message.info({ content: "Logged out. See you next time :D!" })
  }

  obtainScore() {
    fetch(window.ipAddress + "/v1/userPoints/" + this.state.username, {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      if (data.success === true) {
        this.setState({ userScore: data.score })
      }
    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  handleWebSocket(webSocket) {
    this.setState({ scoreboardSocket: webSocket })
  }


  render() {
    return (
      <div style={{ position: "fixed" }}>
        <Transition
          items={this.state.logined}
          native
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0, display: "none" }}
        >
          {(styles, item) => {
            if (item && !this.state.loading) {
              return (
                <animated.div style={{ ...styles, width: "100vw", height: "100vh", backgroundImage: "url(" + require("./assets/mainBG.webp").default + ")", backgroundSize: "cover" }}>
                  <Layout style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}>
                    <Sider
                      className={this.state.mobileBreakpoint ? "mobileSider" : ""}
                      breakpoint="md"
                      collapsedWidth={0}
                      onBreakpoint={(broken) => { broken ? this.setState({ mobileBreakpoint: true }) : this.setState({ mobileBreakpoint: false }) }}
                      style={{ boxShadow: "5px 0px 6px 3px rgba(0, 0, 0, .5)" }}
                    >
                      <div className="overflow-handle">
                        <div style={{ height: "9ch", padding: "15px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                          <img alt="Sieberrsec Logo" src={require("./assets/sieberrsec_ctf.svg").default} style={{ width: "100%", height: "100%", marginRight: "1vw" }}></img>
                        </div>
                        <Dropdown overlay={
                          <Menu>
                            {this.state.team != "teams-disabled" && this.state.team != "loading" && (
                              <div>
                                <Menu.Item key="Team">
                                  <NavLink to="/Team">
                                    <span>
                                      <b style={{ color: "#d89614" }}><u>{this.state.team ? this.state.team : "No Team"}</u></b>
                                      <br />{this.state.team ? "Manage Team " : "Create/Join a Team "}
                                    </span>
                                    <TeamOutlined />
                                  </NavLink>
                                </Menu.Item>
                                <Menu.Divider />
                              </div>
                            )}

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
                              <Avatar size="large" src={"/static/profile/" + this.state.username + ".webp"} />
                            </div>
                            <div>
                              <h3 style={{ color: "#d89614", fontSize: "2.3ch" }}>{this.state.team !== "teams-disabled" && this.state.team != "loading" && this.state.team ? <b>Team Score:</b> : <b>Score:</b>} {this.state.userScore}</h3>
                            </div>
                          </div>
                        </Dropdown>

                        <Menu
                          selectedKeys={[this.state.current]}
                          onSelect={(selection) => { this.setState({ current: selection.key }) }}
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
                      </div>
                    </Sider>

                    <Content style={{ height: "100vh", position: "static", overflow: "hidden", margin: "17.5px" }}>
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

                                    <Route path='/Challenges/:categoryChall?' render={(props) => <Challenges {...props} transition={style} obtainScore={this.obtainScore.bind(this)} username={this.state.username} team={this.state.team} />} />
                                    <Route exact path='/Scoreboard' render={(props) => <Scoreboard {...props} handleWebSocket={this.handleWebSocket.bind(this)} transition={style} scoreboardSocket={this.state.scoreboardSocket} />} />

                                    <Route exact path='/Settings' render={(props) => <Settings {...props} transition={style} logout={this.handleLogout.bind(this)} username={this.state.username} />} />
                                    <Route exact path='/Profile/:user?' render={(props) => <Profile {...props} transition={style} username={this.state.username} key={window.location.pathname} />} />
                                    <Route exact path='/Team/:team?' render={(props) => <Teams {...props} transition={style} key={window.location.pathname} team={this.state.team} setTeam={this.setTeam.bind(this)} obtainScore={this.obtainScore.bind(this)} />} />
                                    <Route exact path='/Team/join/:code' render={(props) => <Teams {...props} transition={style} key={window.location.pathname} team={this.state.team} setTeam={this.setTeam.bind(this)} obtainScore={this.obtainScore.bind(this)} />} />

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
