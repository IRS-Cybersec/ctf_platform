import React from 'react';
import { Layout, Tabs } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined
} from '@ant-design/icons';
import './App.css';
import AdminUsers from "./adminUsers.js";
import AdminChallenges from "./adminChallenges.js";
import AdminSubmissions from "./adminSubmissions.js";
import { animated } from 'react-spring/renderprops';

const { TabPane } = Tabs;

class Admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      key: ""
    }
  }
  componentDidMount = () => {
    const tabPane = this.props.match.params.tabPane;
    if (typeof tabPane !== "undefined") {
      this.setState({ key: decodeURIComponent(tabPane) })
    }

  }

  render() {
    return (

      <animated.div style={{ ...this.props.transition, height: "95vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
        <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>
          <Tabs activeKey={this.state.key} onTabClick={(key) => {
            this.setState({ key: key })
            this.props.history.push("/Admin/" + key)
          }} style={{ overflowY: "auto", overflowX: "auto" }}>
            <TabPane
              tab={<span> Home </span>}
              key=""
            >

              <div style={{ textAlign: "start" }}>
                <p>
                  Welcome to Sieberrsec CTF Platform's admin panel. <br />
              Platform Version: 0.6 14/5/21
              </p>
                <h3>Changelog:</h3>
                <p><u>Version 0.5.2 (31/12/2020)</u></p>
                <ul>
                  <li>Added links to names in solved list</li>
                  <li>CSS improvements</li>
                </ul>
                <p><u>Version 0.5.1 (31/12/2020)</u></p>
                <ul>
                  <li>Added indicator for hidden challenges</li>
                  <li>Minor challenge name CSS improvements</li>
                </ul>
                <p><u>Version 0.5.0 (28/12/2020)</u></p>
                <ul>
                  <li>Conducted genocide against bugs</li>
                  <li>Redesigned website</li>
                  <li>Fixed most CSS display issues</li>
                </ul>
                <p><u>Version 0.14.0 (21/6/2020)</u></p>
                <ul>
                  <li>Fixed challenge loading error</li>
                  <li>Overhauled challenge loading - It now only loads once when you click on challenges</li>
                  <li>Sorting by tags for each category</li>
                  <li>Fixed minor visual bug with login status</li>
                </ul>
                <p><u>Version 0.13.5 (15/6/2020)</u></p>
                <ul>
                  <li>Improved loading screens</li>
                  <li>Fixed ghost hints</li>
                  <li>Sorting by Tags (There is a bug where the loading challenge indicator will not show :/)</li>
                </ul>
                <p><u>Version 0.13.0 (15/6/2020)</u></p>
                <ul>
                  <li>Made mobile view slightly better</li>
                  <li>Added a few filters for challenges :D</li>
                  <li>Scoreboard now has dynamic sizing</li>
                  <li>Login indicator</li>
                  <li>Forms will in general, no longer clear itself when the request fails</li>
                  <li>Fixed edit challenge in admin panel to show correct author</li>
                  <li>Removed lots of redundant imports and console.log()s</li>
                </ul>
                <p><u>Version 0.12.6 (11/6/2020)</u></p>
                <ul>
                  <li>Solve counts for each challenge</li>
                  <li>Even more page transitions</li>
                  <li>Fix scoreboard to take into account time of submission</li>
                </ul>
                <br />
                <p><u>Version 0.12.5 (10/6/2020)</u></p>
                <ul>
                  <li>Fixed Scoreboard</li>
                  <li>Page transitions</li>
                  <li>New admin panel tab - Submissions</li>
                  <li>Added sieberrsec favicon</li>
                  <li>Fixed Free Hints text</li>
                </ul>
              </div>
            </TabPane>
            <TabPane
              tab={<span><UserOutlined />Users</span>}
              key="Users"
            >
              <AdminUsers></AdminUsers>
            </TabPane>
            <TabPane
              tab={<span><AppstoreOutlined />Challenges</span>}
              key="Challenges"
            >
              <AdminChallenges history={this.props.history} location={this.props.location}></AdminChallenges>
            </TabPane>
            <TabPane
              tab={<span><BarsOutlined />Submissions</span>}
              key="Submissions"
            >
              <AdminSubmissions></AdminSubmissions>
            </TabPane>
          </Tabs>

        </Layout>
      </animated.div>
    );
  }
}

export default Admin;
