import React from 'react';
import { Button, Layout, message, Tabs, Card, Upload, Divider } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined,
  NotificationOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import AdminUsers from "./adminUsers.js";
import AdminChallenges from "./adminChallenges.js";
import AdminSubmissions from "./adminSubmissions.js";
import AdminManageAnnouncements from "./adminManageAnnouncements.js";

const { TabPane } = Tabs;

class Admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      key: "",
      backupLoading: false
    }
  }
  componentDidMount = () => {
    const tabPane = this.props.match.params.tabPane;
    if (typeof tabPane !== "undefined") {
      this.setState({ key: decodeURIComponent(tabPane) })
    }
  }

  downloadBackup = async () => {
    this.setState({ backupLoading: true })
    await fetch(window.ipAddress + "/v1/backup", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      //console.log(data)
      if (data.success === true) {
        const downloadData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.data))
        const downloadAnchorNode = document.createElement('a');
        const date = new Date()
        downloadAnchorNode.setAttribute("href", downloadData);
        downloadAnchorNode.setAttribute("download", date.toISOString().slice(0, -15) + "-Backup.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        message.success("Downloaded backup successfully")
      }

    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. Issue connecting with the server or client error, please check console and report the error. " });
    })
    this.setState({ backupLoading: false })
  }

  render() {
    return (

      <Layout className="layout-style">
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

            <div className="settings-responsive" style={{ display: "flex", justifyContent: "space-around" }}>
              <Card>
                <Button type='primary' onClick={this.downloadBackup} loading={this.state.backupLoading}><DownloadOutlined /> Download Backup</Button>
                <p>Download all the data stored in the platform's database. Data can be uploaded onto a different platform/a later date to restore all the data</p>
              </Card>

              <Divider type="vertical" style={{ height: "inherit" }} />

              <Card>
                <Upload
                  fileList={this.state.fileList}
                  disabled={this.state.disableUpload}
                  accept=".json"
                  action={window.ipAddress + ""}
                  maxCount={1}
                  onChange={(file) => {
                    this.setState({ fileList: file.fileList })
                    if (file.file.status === "uploading") {
                      this.setState({ disableUpload: true })
                    }
                    else if ("response" in file.file) {
                      if (file.file.response.success) message.success("Uploaded profile picture")
                      else {
                        message.error("Failed to upload profile picture")
                        if (file.file.response.error === "too-large") {
                          message.info("Please upload a file smaller than " + file.file.response.size.toString() + "Bytes.")
                        }
                      }
                      this.setState({ fileList: [], disableUpload: false })
                    }
                  }}
                  headers={{ "Authorization": localStorage.getItem("IRSCTF-token") }}
                  name="profile_pic"
                  beforeUpload={file => {
                    const exts = ["image/png", "image/jpg", "image/jpeg", "image/webp"]
                    if (!exts.includes(file.type)) {
                      message.error(`${file.name} is not an image file.`);
                      return Upload.LIST_IGNORE
                    }
                    return true
                  }}>
                  <Button disabled type="primary" icon={<UploadOutlined />}>Upload Backup</Button>
                </Upload>
                <p>Restore and upload data stored in a backup json file. <span style={{color: "#d32029"}}><b>Warning: This <u>WILL OVERRIDE ALL EXISTING DATA</u> stored in this platform</b></span></p>
              </Card>
            </div>
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
