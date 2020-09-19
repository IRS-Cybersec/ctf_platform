import React from 'react';
import { Layout, Menu, Avatar, message, Dropdown } from 'antd';
import {
  FlagTwoTone,
  HomeTwoTone,
  FundTwoTone,
  NotificationTwoTone,
  UserOutlined,
  LogoutOutlined,
  CodeTwoTone,
  PlusSquareTwoTone
} from '@ant-design/icons';
import './App.css';
import { NavLink, Switch, Route, withRouter, Redirect } from 'react-router-dom';
import Home from "./home.js";
import Challenges from "./challenges.js";
import Profile from "./profile.js";
import Scoreboard from "./Scoreboard.js";
import Announcements from "./announcements.js";
import Login from "./login.js";
import admin from "./admin.js";
import Oops from "./oops.js";
import UserChallengeCreate from "./userChallengeCreate.js";
import { Transition, animated } from 'react-spring/renderprops';


const { Header, Content, Sider } = Layout;

var previousLocation = ""




class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: false,
      current: "Home",
      token: false,
      logined: false,
      username: "",
      permissions: 0
    };
  }

  // sider handler (for opening and closing sider)
  onCollapse = collapsed => {
    this.setState({ collapsed });
  }


  componentDidMount() {
    // Handle any page changes via manual typing/direct access
    const page = this.props.location.pathname.slice(1);

    if (previousLocation !== page) {
      previousLocation = page
      this.setState({ current: page })
    }


    // Handles "remember me" logins
    if (!this.state.token) {
      const token = localStorage.getItem("IRSCTF-token")
      const key = "login"

      if (token !== null) {
        message.loading({ content: "Attempting to restore session...", key, duration: 0 })
        // Get permissions from server
        fetch("https://api.irscybersec.tk/v1/account/type", {
          method: 'get',
          headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
          return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
          if (data.success === true) {
            const username = token.split(".")[0]
            this.setState({ permissions: data.type, token: token, username: username, logined: true })
            message.success({ content: "Session restored. Welcome back " + username, key, duration: 2.5 })
          }
          else {
            //Might be a fake token since server does not have it, exit
            this.setState({ token: false })
            message.error({ content: "Oops. Failed to restore session, please login again", key, duration: 2.5 })
          }
        }).catch((error) => {
          message.error({ content: "Oops. There was an issue connecting to the server, please try again", key, duration: 2.5 });
        })
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

  handleLogout() {
    sessionStorage.removeItem("IRSCTF-token")
    localStorage.removeItem("IRSCTF-token")
    this.setState({ token: false, logined: false })
    message.info({ content: "Logged out. See you next time :D!" })
  }


  render() {
    return (
      <div style={{ position: "fixed"}}>

        <Transition
          items={this.state.logined}
          native
          from={{ opacity: 0, transform: 'translate3d(100%,0,0)' }}
          enter={{ opacity: 1, transform: 'translate3d(0%,0,0)' }}
          leave={{ opacity: 0, transform: 'translate3d(50%,0,0)' }}
        >
          {toggle => (
            props => {
              if (toggle === true) {
                return (
                  <animated.div style={{ ...props, width: "100vw", height: "100vh", position: "fixed" }}>
                    <Layout>
                      <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse} style={{ width: "15vw", height: "100vh"}}>
                        <div style={{ height: "9vh", padding: "15px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                          <img alt="Sieberrsec Logo" src={require("./sieberrsec_ctf.svg")} style={{ maxWidth: "110%", maxHeight: "200%", marginRight: "1vw" }}></img>
                        </div>
                        <Menu
                          selectedKeys={[this.state.current]}
                          onSelect={(selection) => { this.setState({ current: selection.key }) }}
                          //defaultOpenKeys={['']}
                          mode="inline"
                          theme="dark"

                        > {/*
        defaultSelectedKeys - default selected menu items
        defaultOpenKeys - default opened sub menus
        inline - Sidebar Menu
        */}
                          <Menu.Item key="Home" style={{ fontSize: "115%", height: "8vh", display: "flex", alignItems: "center", marginTop: 0 }}>
                            <NavLink to="/">
                              <HomeTwoTone style={{ fontSize: "110%" }} />
                              <span>Home</span>
                            </NavLink>
                          </Menu.Item>

                          <Menu.Item key="Challenges" style={{ fontSize: "115%", height: "8vh", display: "flex", alignItems: "center" }}>
                            <NavLink to="/Challenges">
                              <FlagTwoTone style={{ fontSize: "110%" }} />
                              <span>Challenges</span>
                            </NavLink>
                          </Menu.Item>

                          <Menu.Item key="Scoreboard" style={{ fontSize: "115%", height: "8vh", display: "flex", alignItems: "center" }}>
                            <NavLink to="/Scoreboard">
                              <FundTwoTone style={{ fontSize: "110%" }} />
                              <span>Scoreboard</span>
                            </NavLink>
                          </Menu.Item>

                          <Menu.Item key="Announcements" style={{ fontSize: "115%", height: "8vh", display: "flex", alignItems: "center" }}>
                            <NavLink to="/Announcements">
                              <NotificationTwoTone style={{ fontSize: "110%" }} />
                              <span>Announcements</span>
                            </NavLink>
                          </Menu.Item>

                          <Menu.Divider />

                          {this.state.permissions === 1 && (
                            <Menu.Item key="CreateChallenge" style={{ fontSize: "115%", height: "8vh", display: "flex", alignItems: "center", color: "#d32029" }}>
                              <NavLink to="/CreateChallenge">
                                <PlusSquareTwoTone style={{ fontSize: "110%" }} twoToneColor="#d89614" />
                                <span>Create Challenge</span>
                              </NavLink>
                            </Menu.Item>
                          )}

                          {this.state.permissions === 2 && (

                            <Menu.Item key="Admin" style={{ fontSize: "115%", height: "8vh", display: "flex", alignItems: "center", color: "#d32029" }}>
                              <NavLink to="/Admin">
                                <CodeTwoTone style={{ fontSize: "110%" }} twoToneColor="#d32029" />
                                <span>Admin Panel</span>
                              </NavLink>
                            </Menu.Item>
                          )}

                        </Menu>
                      </Sider>

                      <Layout style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
                        <Header className="site-layout-background" style={{ height: "9vh" }}>
                          <Dropdown overlay={
                            <Menu>
                              <Menu.Item key="0">
                                <NavLink to="/Profile">
                                  <span>Profile </span>
                                  <UserOutlined />
                                </NavLink>
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item key="logout" onClick={this.handleLogout.bind(this)}>
                                <span style={{ color: "#d32029" }}>Logout <LogoutOutlined /></span>
                              </Menu.Item>
                            </Menu>}
                            trigger={['click']}>
                            <div className="buttonHover"
                              style={{ display: "flex", justifyContent: "row", alignContent: "center", alignItems: "center", height: "9vh", float: "right", paddingLeft: "1vw", paddingRight: "1vw", backgroundColor: "#1765ad", cursor: "pointer" }}>
                              <h3 style={{ marginRight: "1vw" }}>{this.state.username}</h3>
                              <Avatar size="large" src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png" />
                            </div>
                          </Dropdown>
                        </Header>


                        <Content style={{ marginLeft: "10px" }}>
                          <Route
                            render={({ location, ...rest }) => (
                              <div className="fill">
                                <Route exact path="/" render={() => <Redirect to="/" />} />
                                <div className="content">
                                  <Transition
                                    native
                                    items={location}
                                    keys={location.pathname.split('/')[1]}
                                    from={{ transform: 'translateY(100px)', opacity: 0 }}
                                    enter={{ transform: 'translateY(0px)', opacity: 1 }}
                                    leave={{ transform: 'translateY(100px)', opacity: 0 }}>
                                    {(loc, state) => style => (
                                      <Switch location={state === 'update' ? location : loc}>
                                          <Route exact path='/' render={(props) => <Home {...props} transition={style} />} />
                                          <Route exact path='/Challenges' render={(props) => <Challenges {...props} transition={style} />} />
                                          <Route exact path='/Challenges/:category' render={(props) => <Challenges {...props} transition={style} />} />
                                          <Route exact path='/Scoreboard' render={(props) => <Scoreboard {...props} transition={style} />} />
                                          <Route exact path='/Announcements' render={(props) => <Announcements {...props} transition={style} />} />
                                          <Route path='/Profile' render={(props) => <Profile {...props} transition={style} token={this.state.token} username={this.state.username} />} />
                                          <Route path='/Oops' render={(props) => <Oops {...props} transition={style}/>} />

                                          {this.state.permissions >= 1 ? (
                                            <Route exact path='/CreateChallenge' component={UserChallengeCreate} />
                                          ) : (
                                              <Redirect to="/Oops" />
                                            )}

                                          {this.state.permissions === 2 ? (
                                            <Route path='/Admin' component={admin} />
                                          ) : (
                                              <Redirect to="/Oops" />
                                            )}
                                        
                                      </Switch>
                                    )}
                                  </Transition>
                                </div>
                              </div>
                            )}
                          />

                        </Content>
                      </Layout>
                    </Layout>
                  </animated.div>
                )
              }
              else {
                return (
                  <animated.div style={{ ...props, position: "absolute" }}>
                    <Login handleLogin={this.handleLogin.bind(this)}></Login>
                  </animated.div>)
              }
            }
          )}
        </Transition>
      </div>
    );
  }
}

export default withRouter(App);
