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

const { TabPane } = Tabs;

class admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout className="pageTransition" style={{ height: "100%", width: "100%" }}>
        <Tabs defaultActiveKey="home" style={{ overflowY: "scroll", overflowX: "hidden" }}>
          <TabPane
            tab={<span> Home </span>}
            key="home"
          >
            Admin Panel. Still WIP
          </TabPane>
          <TabPane
            tab={<span><UserOutlined />Users</span>}
            key="users"
          >
            <AdminUsers></AdminUsers>
          </TabPane>
          <TabPane
            tab={<span><AppstoreOutlined />Challenges</span>}
            key="challenges"
          >
            <AdminChallenges></AdminChallenges>
          </TabPane>
          <TabPane
            tab={<span><BarsOutlined />Submissions</span>}
            key="submissions"
          >
            <AdminSubmissions></AdminSubmissions>
          </TabPane>
        </Tabs>
      </Layout>
    );
  }
}

export default admin;
