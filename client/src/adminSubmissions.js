import React from 'react';
import { Layout, Table, message } from 'antd';
import {
    FileUnknownTwoTone,
} from '@ant-design/icons';
import { orderBy } from "lodash";
import { Ellipsis } from 'react-spinners-css';
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
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/submissions", {
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

                this.setState({ dataSource: data.submissions, loading: false })
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

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

                {this.state.loading && (
                    <div style={{ position: "absolute", left: "50%", transform: "translate(-50%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                )}
                {!this.state.loading && (
                    <Table style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                        emptyText: (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                            <h1 style={{ fontSize: "200%" }}>There are no submissions yet.</h1>
                        </div>
                        )
                    }}>
                        <Column title="Submission ID" dataIndex="_id" key="_id" />
                        <Column title="Time" dataIndex="timestamp" key="timestamp" />
                        <Column title="Submittor" dataIndex="author" key="author" />
                        <Column title="Challenge" dataIndex="challenge" key="challenge" />
                        <Column title="Type" dataIndex="type" key="type" />
                        <Column title="Points Awarded" dataIndex="points" key="points" />
                        <Column title="Flag Submitted" dataIndex="submission" key="submission" />
                        <Column title="Correct" dataIndex="correct" key="correct" />
                    </Table>
                )}
            </Layout>
        );
    }
}

export default AdminSubmissions;