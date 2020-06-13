import React from 'react';
import { Layout } from 'antd';
import {
  FlagTwoTone,
} from '@ant-design/icons';
import './App.css';

const { Header, Content, Footer, Sider } = Layout;


class announcements extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout className="pageTransition" style={{ height: "100%", width: "100%"  }}>
          Announcements
      </Layout>
    );
  }
}

export default announcements;
