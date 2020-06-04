import React from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Select, Modal, Form, Input } from 'antd';
import {
    LoadingOutlined,
    ExclamationCircleTwoTone,
    DeleteOutlined,
    ClusterOutlined,
    UserOutlined,
    MailOutlined
} from '@ant-design/icons';
import './App.css';
import { NavLink, Switch, Route, withRouter, useHistory, useLocation } from 'react-router-dom';

const { Column } = Table;
const { Option } = Select;

class AdminUsers extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            permissionModal: false,
            permissionLevel: 0,
            permissionChangeTo: 0,
            deleteModal: false,
            createUserModal: false,
            username: "",
            modalLoading: false,
        }


    }

    componentDidMount() {
        this.fillTableData()
    }

    fillTableData = () => {
        fetch("https://api.irscybersec.tk//v1/account/list", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                this.setState({ dataSource: data.list })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    changePermissions = () => {
        console.log("test")
        this.setState({ modalLoading: true })
        fetch("https://api.irscybersec.tk/v1/account/permissions", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "username": this.state.username,
                "type": this.state.permissionChangeTo
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success({ content: "Permissions changed successfully" })
                this.setState({ modalLoading: false, permissionModal: false })
                this.fillTableData()
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }



    deleteAccount = () => {
        fetch("https://api.irscybersec.tk/v1/account/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "username": this.state.username,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            console.log(data)
            if (data.success === true) {
                message.success({ content: "User deleted successfully" })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })

    }

    createAccount = (values) => {
        this.setState({ modalLoading: true })
        fetch("https://api.irscybersec.tk/v1/account/create", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "username": values.username,
                "password": values.password,
                "email": values.email
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success({ content: "Created user " + values.username + " successfully!" })
                this.setState({ modalLoading: false, createUserModal: false })
                this.fillTableData()
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


                <Modal
                    title="Set permissions"
                    visible={this.state.permissionModal}
                    onOk={this.changePermissions}
                    onCancel={() => { this.setState({ permissionModal: false }) }}
                    confirmLoading={this.state.modalLoading}
                >
                    <h4>Current Permission Level: <u>{this.state.permissionLevel}</u></h4>
                    <Select defaultValue={0} style={{ width: "10vw" }} onSelect={(value) => { this.setState({ permissionChangeTo: value }) }}>
                        <Option value="0">0</Option>
                        <Option value="1">1</Option>
                        <Option value="2">2</Option>
                    </Select>
                </Modal>

                <Modal
                    title={"Are you sure you want to delete \"" + this.state.username + "\" ?"}
                    visible={this.state.deleteModal}
                    onOk={this.deleteAccount}
                    onCancel={() => { this.setState({ deleteModal: false }) }}
                    confirmLoading={this.state.modalLoading}
                >
                    <h4>This action of mass destruction is irreveisble! <ExclamationCircleTwoTone twoToneColor="#d32029" /> </h4>
                </Modal>

                <Modal
                    title="Create New Account"
                    visible={this.state.createUserModal}
                    onOk={this.createAccount}
                    footer={null}
                    onCancel={() => { this.setState({ createUserModal: false }) }}
                    confirmLoading={this.state.modalLoading}
                >

                    <Form
                        name="register_form"
                        className="register-form"
                        onFinish={this.createAccount}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Please enter a username' }]}
                        >
                            <Input allowClear prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Enter a new username" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter an email' },
                                {
                                    type: 'email',
                                    message: "Please enter a valid email",
                                },]}
                        >
                            <Input allowClear prefix={<MailOutlined />} placeholder="Enter a new email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your password!',
                                },
                            ]}
                            hasFeedback
                        >
                            <Input.Password allowClear placeholder="Enter a new password" />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                {
                                    required: true,
                                    message: 'Please confirm your password!',
                                },
                                ({ getFieldValue }) => ({
                                    validator(rule, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject('Oops, the 2 passwords do not match');
                                    },
                                }),
                            ]}
                        >
                            <Input.Password allowClear placeholder="Confirm new password" />
                        </Form.Item>
                        <Form.Item>
                                <Button style={{ marginRight: "1.5vw" }} onClick={() => { this.setState({ createUserModal: false }) }}>Cancel</Button>
                                <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }}>Create Account</Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Button type="primary" style={{ marginBottom: "2vh" }} icon={<UserOutlined />} onClick={() => { this.setState({ createUserModal: true }) }}>Create New User</Button>

                <Table style={{ overflow: "scroll" }} dataSource={this.state.dataSource} locale={{
                    emptyText: (
                        <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", fontSize: "3vw" }}>
                            <LoadingOutlined />
                        </div>
                    )
                }}>
                    <Column title="Username" dataIndex="username" key="username" />
                    <Column title="Email" dataIndex="email" key="email" />
                    <Column title="Score" dataIndex="score" key="score" />
                    <Column title="Permissions" dataIndex="type" key="type" />
                    <Column
                        title="Action"
                        key="action"
                        render={(text, record) => (
                            <Dropdown trigger={['click']} overlay={
                                <Menu>
                                    <Menu.Item onClick={() => { this.setState({ permissionModal: true, username: record.username, permissionLevel: record.type }) }}>
                                        <span>
                                            Change Permissions <ClusterOutlined />
                                        </span>
                                    </Menu.Item>
                                    <Menu.Item>
                                        <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
                                            2nd menu item
                                      </a>
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item onClick={() => { this.setState({ username: record.username, deleteModal: true }) }}>
                                        <span style={{ color: "#d32029" }} >
                                            Delete Account <DeleteOutlined />
                                        </span>
                                    </Menu.Item>
                                </Menu>
                            } placement="bottomCenter">
                                <Button>Actions</Button>
                            </Dropdown>
                        )}
                    />
                </Table>
            </Layout>
        );
    }
}

export default AdminUsers;