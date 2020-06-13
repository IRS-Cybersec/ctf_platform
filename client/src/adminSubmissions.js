import React from 'react';
import { Layout, Table, message, Select } from 'antd';
import {
    LoadingOutlined,
} from '@ant-design/icons';
import { orderBy } from "lodash";
import './App.css';

const { Column } = Table;


class AdminSubmissions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
        }
    }

    componentDidMount() {
        this.fillTableData()
    }

    fillTableData = () => {
        fetch("https://api.irscybersec.tk/v1/submissions", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            data.submissions = orderBy(data.submissions, ["timestamp"], ["desc"])
            
            if (data.success === true) {
                for (let i = 0; i < data.submissions.length; i++) {
                    if (data.submissions[i].correct === false) {
                        data.submissions[i].correct = "False"
                    }
                    else {
                        data.submissions[i].correct = "True"
                    }

                    data.submissions[i].timestamp = new Date(data.submissions[i].timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })
                }

                this.setState({ dataSource: data.submissions })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }
    





    render() {
        return (

            <Layout style={{ height: "100%", width: "100%" }}>

                <Table style={{ overflow: "scroll" }} dataSource={this.state.dataSource} locale={{
                    emptyText: (
                        <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", fontSize: "3vw" }}>
                            <LoadingOutlined style={{color: "#177ddc"}}/>
                        </div>
                    )
                }}>
                    <Column title="ID" dataIndex="_id" key="_id" />
                    <Column title="Time" dataIndex="timestamp" key="timestamp" />
                    <Column title="Submittor" dataIndex="author" key="author" />
                    <Column title="Challenge" dataIndex="challenge" key="challenge" />
                    <Column title="Type" dataIndex="type" key="type" />
                    <Column title="Points" dataIndex="points" key="points" />
                    <Column title="Flag Submitted" dataIndex="submission" key="submission" />
                    <Column title="Correct" dataIndex="correct" key="correct" />
                </Table>
            </Layout>
        );
    }
}

export default AdminSubmissions;