import React from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Select, Modal, Form, Input, Switch, Divider } from 'antd';
import {
    FileUnknownTwoTone,
    ExclamationCircleOutlined,
    DeleteOutlined,
    ClusterOutlined,
    UserOutlined,
    MailOutlined,
    LockOutlined,
    RedoOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Ellipsis } from 'react-spinners-css';
import './App.min.css';

const { Column } = Table;
const { Option } = Select;
const { confirm } = Modal;


const RegisterForm = (props) => {
    const [form] = Form.useForm();
    return (
        <Form
            form={form}
            name="register_form"
            className="register-form"
            onFinish={(values) => { props.createAccount(values); form.resetFields() }}
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
                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter a new password" />
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
                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Confirm new password" />
            </Form.Item>
            <Form.Item>
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ createUserModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }}>Create Account</Button>
            </Form.Item>
        </Form>
    );
};


class AdminUsers extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            permissionModal: false,
            permissionLevel: 0,
            permissionChangeTo: 0,
            createUserModal: false,
            username: "",
            modalLoading: false,
            disableRegisterState: false,
            disableLoading: false
        }
    }

    componentDidMount() {
        this.fillTableData()
        this.getDisableRegister()
    }

    getDisableRegister = async () => {
        this.setState({ disableLoading: true })
        await fetch(window.ipAddress + "/v1/account/disableCreate", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                console.log(data)
                this.setState({ disableRegisterState: data.state })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }

    fillTableData = async () => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/account/list", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                this.setState({ dataSource: data.list, loading: false })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    changePermissions = () => {
        this.setState({ modalLoading: true })
        fetch(window.ipAddress + "/v1/account/permissions", {
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



    deleteAccount = (close, username) => {
        fetch(window.ipAddress + "/v1/account/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "username": username,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {

                message.success({ content: "User \"" + username + "\" deleted successfully" })
                this.fillTableData()
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            close()


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
            close()
        })

    }

    createAccount = (values) => {
        this.setState({ modalLoading: true })
        fetch(window.ipAddress + "/v1/account/create", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "username": values.username,
                "password": values.password,
                "email": values.email
            })
        }).then((results) => {
            //console.log(results)
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Created user " + values.username + " successfully!" })
                this.setState({ modalLoading: false, createUserModal: false })
                this.fillTableData()
            }
            else if (data.error === "email-taken") {
                message.warn({ content: "Oops. Email already taken" })
            }
            else if (data.error === "username-taken") {
                message.warn({ content: "Oops. Username already taken" })
            }
            else if (data.error === "email-formatting") {
                message.error({ content: "Oops. Please check your email format" })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })

    }

    disableRegister = async (value) => {
        this.setState({ disableLoading: true })
        await fetch(window.ipAddress + "/v1/account/disableCreate", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                disable: value
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                if (value) {
                    message.success("User registration disabled")
                }
                else {
                    message.success("User registration enabled")
                }
                this.setState({disableRegisterState: value})
                
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }





    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                {this.state.loading && (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                )}
                <Modal
                    title={<span>Change User Permissions <ClusterOutlined /></span>}
                    visible={this.state.permissionModal}
                    onOk={this.changePermissions}
                    onCancel={() => { this.setState({ permissionModal: false }) }}
                    confirmLoading={this.state.modalLoading}
                >
                    <Select size="large" value={this.state.permissionChangeTo} style={{ width: "30ch" }} onSelect={(value) => { this.setState({ permissionChangeTo: value }) }}>
                        <Option value="0">0 - Normal User</Option>
                        <Option value="1">1 - Challenge Creator User</Option>
                        <Option value="2">2 - Admin User</Option>
                    </Select>
                    <br />
                    <br />

                    <ul>
                        <li><b>0 - Normal User</b>: Has access to the basic functions and nothing else</li>
                        <li><b>1 - Challenge Creator User</b>: Has the additional power of submitting new challenges, but not modifying existing ones</li>
                        <li><b>2 - Admin User</b>: Has full access to the platform via the admin panel.</li>
                    </ul>
                </Modal>

                <Modal
                    title="Create New Account"
                    visible={this.state.createUserModal}
                    onOk={this.createAccount}
                    footer={null}
                    onCancel={() => { this.setState({ createUserModal: false }) }}
                    confirmLoading={this.state.modalLoading}
                >

                    <RegisterForm createAccount={this.createAccount.bind(this)} setState={this.setState.bind(this)}></RegisterForm>
                </Modal>


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Button type="primary" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<UserOutlined />} onClick={() => { this.setState({ createUserModal: true }) }}>Create New User</Button>
                    <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<RedoOutlined />} onClick={async () => { await this.fillTableData(); message.success("Users list refreshed.") }} />
                </div>
                {!this.state.loading && (
                    <Table style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                        emptyText: (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                <h1 style={{ fontSize: "200%" }}>There are no users created</h1>
                            </div>
                        )
                    }}>
                        <Column title="Username" dataIndex="username" key="username"
                            render={(text, row, index) => {
                                return <Link to={"/Profile/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                            }}
                        />
                        <Column title="Email" dataIndex="email" key="email" />
                        <Column title="Score" dataIndex="score" key="score" />
                        <Column title="Permissions" dataIndex="type" key="type" />
                        <Column
                            title=""
                            key="action"
                            render={(text, record) => (
                                <Dropdown trigger={['click']} overlay={
                                    <Menu>
                                        <Menu.Item onClick={() => {
                                            this.setState({ permissionModal: true, username: record.username, permissionChangeTo: record.type.toString() })
                                        }}>
                                            <span>
                                                Change Permissions <ClusterOutlined />
                                            </span>
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item onClick={() => {
                                            confirm({
                                                title: 'Are you sure you want to delete the user \"' + record.username + '\"? This action is irreversible.',
                                                icon: <ExclamationCircleOutlined />,
                                                onOk: (close) => { this.deleteAccount(close.bind(this), record.username) },
                                                onCancel: () => { },
                                            });
                                        }}>
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
                )}
                <Divider />
                <h3>Disable User Registration:  <Switch disabled={this.state.disableLoading} onClick={this.disableRegister} checked={this.state.disableRegisterState} /></h3>

            </Layout>
        );
    }
}

export default AdminUsers;