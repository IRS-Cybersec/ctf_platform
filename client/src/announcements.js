import React from 'react';
import { Layout } from 'antd';
import {
  NotificationTwoTone,
} from '@ant-design/icons';
import './App.css';


class announcements extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout className="pageTransition" style={{ height: "100%", width: "100%"  }}>
          <p>Announcements <NotificationTwoTone /> </p>
      </Layout>
    );
  }
}

export default announcements;
