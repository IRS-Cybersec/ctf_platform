import React from 'react';
import { Layout, Tabs } from 'antd';
import {
  UserOutlined
} from '@ant-design/icons';
import './App.css';
import AdminUsers from "./adminUsers.js";
import { NavLink, Switch, Route, withRouter, useHistory, useLocation } from 'react-router-dom';

const { TabPane } = Tabs;

class admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%" }}>
        <Tabs defaultActiveKey="home">
          <TabPane
            tab={<span>  Home </span> }
            key="home"
          >
            Admin Panel. Still WIP
    </TabPane>
          <TabPane
            tab={ <span><UserOutlined />Users </span>}
            key="users"
          >
            <AdminUsers></AdminUsers>
    </TabPane>
        </Tabs>
      </Layout>
    );
  }
}

export default admin;
