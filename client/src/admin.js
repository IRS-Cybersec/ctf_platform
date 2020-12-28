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
    };
  }

  render() {
    return (

      <animated.div style={{ ...this.props.transition, height: "100vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
        <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>
          <Tabs defaultActiveKey="home" style={{ overflowY: "auto", overflowX: "auto" }}>
            <TabPane
              tab={<span> Home </span>}
              key="home"
            >
              <p>
                Welcome to Sieberrsec CTF Platform's admin panel. <br />
              Platform Version: 0.5 28/12/20
              </p>
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
      </animated.div>
    );
  }
}

export default Admin;
