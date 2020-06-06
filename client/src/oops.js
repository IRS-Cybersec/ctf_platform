import React from 'react';
import { Layout } from 'antd';
import {
  FileUnknownOutlined,
} from '@ant-design/icons';
import './App.css';


class Oops extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%", textAlign: "center", marginTop: "10vh" }}>
           <FileUnknownOutlined style={{fontSize: "400%", marginBottom: "2vh"}} />
          <h2>Welcome to Limbo.</h2> 
          <p>You probably ended up here because you tried to access a page you did not have access to (or you visited this page manually). </p>
          <p>Click on any of the links on the menu to return to society :D. </p>
          <p>If you believe this is an error, please contact an admin.</p>
      </Layout>
    );
  }
}

export default Oops;
