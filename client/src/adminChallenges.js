import React from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Modal } from 'antd';
import {
    LoadingOutlined,
    ExclamationCircleTwoTone,
    DeleteOutlined,
    FlagOutlined,
    EditOutlined
} from '@ant-design/icons';
import './App.css';
import AdminChallengeCreate from "./adminChallengeCreate.js";
import AdminChallengeEdit from "./adminChallengeEdit.js";

const { Column } = Table;



class AdminChallenges extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            deleteModal: false,
            challengeName: "",
            modalLoading: false,
            challengeCreate: false,
            editChallenge: false
        }
    }

    componentDidMount() {
        this.fillTableData()
    }

    /*getCategories() {
        fetch("https://api.irscybersec.tk/v1/challenge/list_categories", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {

            if (data.success === true) {
                this.setState({ dataSource: data.challenges })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }*/

    fillTableData = () => {
        fetch("https://api.irscybersec.tk/v1/challenge/list_all", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {

            if (data.success === true) {
                for (var i = 0; i < data.challenges.length; i++) {
                    if (data.challenges[i].visibility === false) {
                        data.challenges[i].visibility = "Hidden"
                    }
                    else {
                        data.challenges[i].visibility = "Shown"
                    }
                }
                this.setState({ dataSource: data.challenges })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }



    deleteChallenge = () => {
        this.setState({ modalLoading: true })
        fetch("https://api.irscybersec.tk/v1/challenge/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "chall": this.state.challengeName,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            console.log(data)
            if (data.success === true) {
                message.success({ content: "Deleted challenge " + this.state.challengeName + " successfully" })
                this.fillTableData()
                this.setState({ deleteModal: false })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }

            this.setState({ modalLoading: false })


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })

    }

    handleBack() {
        this.setState({ challengeCreate: false })
    }

    handleEditBack() {
        this.setState({ editChallenge: false })
    }

    handleCreateBack() {
        this.setState({ challengeCreate: false })
        this.fillTableData()
    }

    handleEditChallBack() {
        this.setState({ editChallenge: false })
        this.fillTableData()
    }





    render() {
        return (

            <Layout style={{ height: "100%", width: "100%" }}>
                {/*<Transfer
                            dataSource={mockData}
                            titles={['Source', 'Target']}
                            targetKeys={targetKeys}
                            selectedKeys={selectedKeys}
                            onChange={this.handleChange}
                            render={item => item.title}
                            pagination
                        />
                        <Space style={{ marginTop: 16 }}>
                            <Switch
                                unCheckedChildren="disabled"
                                checkedChildren="disabled"
                                checked={disabled}
                                onChange={this.handleDisable}
                            />
                        </Space>*/
                }
                <Modal
                    title={"Are you sure you want to delete \"" + this.state.challengeName + "\" ?"}
                    visible={this.state.deleteModal}
                    onOk={this.deleteChallenge}
                    onCancel={() => { this.setState({ deleteModal: false }) }}
                    confirmLoading={this.state.modalLoading}
                >
                    <h4>This action of mass destruction is irreveisble! <ExclamationCircleTwoTone twoToneColor="#d32029" /> </h4>
                </Modal>

                {!this.state.challengeCreate && !this.state.editChallenge && (
                    <div>

                        <Button type="primary" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<FlagOutlined />} onClick={() => { this.setState({ challengeCreate: true }) }}>Create New Challenge</Button>



                        <Table style={{ overflow: "scroll" }} dataSource={this.state.dataSource} locale={{
                            emptyText: (
                                <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", fontSize: "3vw" }}>
                                    <LoadingOutlined />
                                </div>
                            )
                        }}>
                            <Column title="Name" dataIndex="name" key="name" />
                            <Column title="Category" dataIndex="category" key="category" />
                            <Column title="Points" dataIndex="points" key="points" />
                            <Column title="Visbility" dataIndex="visibility" key="visibility" />
                            <Column
                                title="Edit"
                                key="edit"
                                render={(text, record) => (
                                    <Dropdown trigger={['click']} overlay={
                                        <Menu>
                                            <Menu.Item onClick={() => { this.setState({ editChallenge: true, challengeName: record.name }) }}>
                                                <span>
                                                    Edit Challenge <EditOutlined />
                                                </span>
                                            </Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item onClick={() => { this.setState({ challengeName: record.name, deleteModal: true }) }}>
                                                <span style={{ color: "#d32029" }} >
                                                    Delete Challenge <DeleteOutlined />
                                                </span>
                                            </Menu.Item>
                                        </Menu>
                                    } placement="bottomCenter">
                                        <Button>Actions</Button>
                                    </Dropdown>
                                )}
                            />
                        </Table>
                    </div>
                )}

                {this.state.challengeCreate && !this.state.editChallenge && (
                    <AdminChallengeCreate handleBack={this.handleBack.bind(this)} handleCreateBack={this.handleCreateBack.bind(this)}></AdminChallengeCreate>
                )}

                {this.state.editChallenge && !this.state.challengeCreate && (
                    <AdminChallengeEdit challengeName={this.state.challengeName} handleEditBack={this.handleEditBack.bind(this)} handleEditChallBack={this.handleEditChallBack.bind(this)}></AdminChallengeEdit>
                )}

            </Layout>
        );
    }
}

export default AdminChallenges;