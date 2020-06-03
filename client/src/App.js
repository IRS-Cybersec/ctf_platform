import React from 'react';
import { Layout, Menu, Button, Avatar, Divider, message, Dropdown } from 'antd';
import {
  FlagTwoTone,
  HomeTwoTone,
  FundTwoTone,
  NotificationTwoTone,
  UserOutlined,
  LogoutOutlined,
  CodeTwoTone
} from '@ant-design/icons';
import './App.css';
import { NavLink, Switch, Route, withRouter, useHistory, useLocation, Redirect } from 'react-router-dom';
import home from "./home.js";
import challenges from "./challenges.js";
import Profile from "./profile.js";
import Scoreboard from "./Scoreboard.js";
import announcements from "./announcements.js";
import Login from "./login.js";
import admin from "./admin.js";
import Oops from "./oops.js";


const { Header, Content, Footer, Sider } = Layout;

var previousLocation = ""




class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: false,
      current: "Home",
      token: false,
      username: "",
      permissions: 0
    };
  }

  // sider handler (for opening and closing sider)
  onCollapse = collapsed => {
    this.setState({ collapsed });
  }


  componentWillMount() {
    // Handle any page changes via manual typing/direct access
    const page = this.props.location.pathname.slice(1);

    if (previousLocation !== page) {
      previousLocation = page
      this.setState({ current: page })
    }


    // Handles "remember me" logins
    if (!this.state.token) {
      const token = localStorage.getItem("IRSCTF-token")

      
      if (token !== null) {

          // Get permissions from server
          fetch("https://api.irscybersec.tk/v1/account/type", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
          }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
          }).then((data) => {
            if (data.success === true) {
              const username = token.split(".")[0]
              this.setState({ permissions: data.type, token: token, username: username})
              message.success({content: "Session restored. Welcome back " + username})
            }
            else { 
              //Might be a fake token since server does not have it, exit
              this.setState({ token: false })
              message.error({content: "Oops. Failed to restore session, please login again"})
            }
          }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting to the server" });
          })
      }
    }
  }

  // Callback function for Login component to set token and perms
  handleLogin(receivedToken, permissions, remember) {
    const username = receivedToken.split(".")[0]
    this.setState({ token: receivedToken, permissions: permissions, username: username })

    if (remember === true) {
      localStorage.setItem('IRSCTF-token', receivedToken)
    }
    else {
      sessionStorage.setItem("IRSCTF-token", receivedToken);
    }
    message.success({ content: "Logged In! Welcome " + username })
  }

  handleLogout() {
    sessionStorage.removeItem("IRSCTF-token")
    localStorage.removeItem("IRSCTF-token")
    this.setState({ token: false })
    message.info({ content: "Logged out. See you next time :D!" })
  }


  render() {
    return (
      <div>
        {this.state.token && (
          <Layout style={{ height: "100vh", width: "100vw" }}>
            <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse} style={{ width: "15vw" }}>
              <div style={{ height: "9vh", padding: "15px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                <img src="https://jloh02.github.io/images/CTF/cyberthon-2020/cyberthon.png" style={{ maxWidth: "13vw", maxHeight: "8vh", marginRight: "1vw" }}></img>
                <Divider type="vertical" style={{ height: "6vh", zIndex: 2 }}></Divider>
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
                <Menu.Item key="Home" style={{ fontSize: "1.2vw", height: "8vh", display: "flex", alignItems: "center", marginTop: 0 }}>
                  <NavLink to="/">
                    <HomeTwoTone style={{ fontSize: "1.4vw" }} />
                    <span>Home</span>
                  </NavLink>
                </Menu.Item>

                <Menu.Item key="Challenges" style={{ fontSize: "1.2vw", height: "8vh", display: "flex", alignItems: "center" }}>
                  <NavLink to="/Challenges">
                    <FlagTwoTone style={{ fontSize: "1.4vw" }} />
                    <span>Challenges</span>
                  </NavLink>
                </Menu.Item>

                <Menu.Item key="Scoreboard" style={{ fontSize: "1.2vw", height: "8vh", display: "flex", alignItems: "center" }}>
                  <NavLink to="/Scoreboard">
                    <FundTwoTone style={{ fontSize: "1.4vw" }} />
                    <span>Scoreboard</span>
                  </NavLink>
                </Menu.Item>

                <Menu.Item key="Announcements" style={{ fontSize: "1.2vw", height: "8vh", display: "flex", alignItems: "center" }}>
                  <NavLink to="/Announcements">
                    <NotificationTwoTone style={{ fontSize: "1.4vw" }} />
                    <span>Announcements</span>
                  </NavLink>
                </Menu.Item>

                <Menu.Divider />

                {this.state.permissions === 2 && (

                  <Menu.Item key="Admin" style={{ fontSize: "1.2vw", height: "8vh", display: "flex", alignItems: "center", color: "#d32029" }}>
                    <NavLink to="/Admin">
                      <CodeTwoTone style={{ fontSize: "1.4vw" }} twoToneColor="#d32029" />
                      <span>Admin Panel</span>
                    </NavLink>
                  </Menu.Item>
                )}

              </Menu>
            </Sider>

            <Layout style={{ width: "100vw", height: "100vh" }}>
              <Header className="site-layout-background" style={{ height: "9vh", position: "fixed", zIndex: 1, width: "85vw" }}>
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
                    style={{ display: "flex", justifyContent: "row", alignContent: "center", alignItems: "center", height: "9vh", float: "right", paddingLeft: "1vw", paddingRight: "1vw", backgroundColor: "#1765ad", borderRadius: "5px", cursor: "pointer" }}>
                    <h3 style={{ marginRight: "1vw" }}>{this.state.username}</h3>
                    <Avatar size="large" src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png" />
                  </div>
                </Dropdown>
              </Header>


              <Content style={{ margin: '10vh 20px' }}>
                <Switch>
                    <Route exact path='/' component={home} />
                    <Route exact path='/Challenges' component={challenges} />
                    <Route exact path='/Scoreboard' component={Scoreboard} />
                    <Route exact path='/Announcements' component={announcements} />
                    <Route path='/Profile' render={(props) => <Profile {...props} token={this.state.token} username={this.state.username} />} />
                    <Route path='/Oops' component={Oops} />

                    {this.state.permissions === 2 ? (
                      <Route path='/Admin' component={admin} />
                    ) : (
                      <Redirect to="/Oops" />
                    )}


                </Switch>
              </Content>


              <Footer style={{ textAlign: 'center' }}>HCIRS Cybersec CTF Platform &copy; 2020</Footer>
            </Layout>
          </Layout>
        )}

        {!this.state.token && (
          <Login handleLogin={this.handleLogin.bind(this)}></Login>
        )}
      </div>
    );
  }
}

export default withRouter(App);
