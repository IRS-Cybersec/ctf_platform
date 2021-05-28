import React from 'react';
import { Layout, Tabs } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import './App.min.css';
import AdminUsers from "./adminUsers.js";
import AdminChallenges from "./adminChallenges.js";
import AdminSubmissions from "./adminSubmissions.js";
import AdminManageAnnouncements from "./adminManageAnnouncements.js";

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

      <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>
        <Tabs activeKey={this.state.key} onTabClick={async (key) => {
          await this.props.history.push("/Admin/" + key)
          if (this.props.location.pathname === "/Admin/" + key) this.setState({ key: key })

        }} style={{ overflowY: "auto", overflowX: "auto" }}>
          <TabPane
            tab={<span> Home </span>}
            key=""
          >
            <h1>Welcome to Sieberrsec CTF Platform's admin panel.</h1>
            <h1>Click on any of the tabs above to manage different parts of the portal.</h1>
          </TabPane>
          <TabPane
            tab={<span><NotificationOutlined />Announcements</span>}
            key="Announcements"
          >
            <AdminManageAnnouncements />
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
    );
  }
}

export default Admin;
