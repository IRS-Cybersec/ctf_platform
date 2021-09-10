import React from 'react';
import { Layout, Table, message, Button, Space, Input } from 'antd';
import {
    FileUnknownTwoTone,
    RedoOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { orderBy } from "lodash";
import { Ellipsis } from 'react-spinners-css';
import { Link } from 'react-router-dom';

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

    fillTableData = async () => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/submissions", {
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

                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<RedoOutlined />} onClick={async () => { await this.fillTableData(); message.success("Submissions list refreshed.") }} />
                </div>

                {this.state.loading && (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                )}
                {!this.state.loading && (
                    <Table style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                        emptyText: (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                <h1 style={{ fontSize: "200%" }}>No Submissions Found/Created.</h1>
                            </div>
                        )
                    }}>
                        <Column title="Submission ID" dataIndex="_id" key="_id" />
                        <Column title="Time" dataIndex="timestamp" key="timestamp" />
                        <Column title="Submittor" dataIndex="author" key="author" render={(text, row, index) => {
                            return <Link to={"/Profile/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                        }}
                            filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                                <div style={{ padding: 8 }}>
                                    <Input
                                        placeholder="Search Submittor"
                                        value={selectedKeys[0]}
                                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                        onPressEnter={() => confirm()}
                                        style={{ marginBottom: 8, display: 'block' }}
                                    />
                                    <Space>
                                        <Button
                                            type="primary"
                                            onClick={() => { confirm() }}
                                            icon={<SearchOutlined />}
                                        >
                                            Search
                                        </Button>
                                        <Button onClick={() => clearFilters()}>
                                            Reset
                                        </Button>
                                    </Space>
                                </div>
                            )}
                            onFilter={(value, record) => record.author.includes(value.toLowerCase())}
                            filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}

                        />
                        <Column render={(text, row, index) => {
                                return <Link to={"/Challenges/" + row.challengeID}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                            }} title="Challenge" dataIndex="challenge" key="challenge"
                            filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                                <div style={{ padding: 8 }}>
                                    <Input
                                        placeholder="Search Challenge Name"
                                        value={selectedKeys[0]}
                                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                        onPressEnter={() => confirm()}
                                        style={{ marginBottom: 8, display: 'block' }}
                                    />
                                    <Space>
                                        <Button
                                            type="primary"
                                            onClick={() => { confirm() }}
                                            icon={<SearchOutlined />}
                                        >
                                            Search
                                        </Button>
                                        <Button onClick={() => clearFilters()}>
                                            Reset
                                        </Button>
                                    </Space>
                                </div>
                            )}
                            onFilter={(value, record) => record.challenge.includes(value.toLowerCase())}
                            filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />} />
                        <Column title="Type" dataIndex="type" key="type" />
                        <Column title="Points Awarded" dataIndex="points" key="points" sorter={(a, b) => a.points - b.points} />
                        <Column title="Flag Submitted" dataIndex="submission" key="submission" />
                        <Column title="Correct" dataIndex="correct" key="correct" filters={[{ text: "True", value: "True" }, { text: "False", value: "False" }]} onFilter={(value, record) => { return value === record.correct }}  />
                    </Table>
                )}
            </Layout >
        );
    }
}

export default AdminSubmissions;