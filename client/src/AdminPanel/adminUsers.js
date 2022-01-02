import React, { useEffect } from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Select, Modal, Form, Input, Switch, Divider, Space, InputNumber, Card, Radio } from 'antd';
import {
    FileUnknownTwoTone,
    ExclamationCircleOutlined,
    DeleteOutlined,
    ClusterOutlined,
    UserOutlined,
    MailOutlined,
    LockOutlined,
    RedoOutlined,
    SearchOutlined,
    KeyOutlined,
    CheckOutlined,
    CloseOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    ApartmentOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Ellipsis } from 'react-spinners-css';

const { Column } = Table;
const { Option } = Select;
const { confirm } = Modal;

const SelectParticipantCategoryForm = (props) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const [options, setOptions] = React.useState("")

    useEffect(() => {
        let optionList = props.categoryList.map((currentCat) => {
            return <Radio value={currentCat}>{currentCat}</Radio>
        })
        optionList.push(<Radio value="none"><b>No Category</b></Radio>)
        setOptions(optionList)
        form.setFieldsValue({ category: props.participantCategory })

    }, [props.username])

    return (
        <Form
            form={form}
            onFinish={async (values) => {
                setLoading(true)
                await fetch(window.ipAddress + "/v1/account/change/category", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "username": props.username,
                        "category": values.category,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Category for '" + props.username + "' successfully changed to '" + values.category + "'." })
                        form.setFieldsValue({
                            category: values.category
                        })
                        props.fillTableData()
                    }
                    else if (data.error === "email-taken") {
                        message.error({ content: "Email is already taken, please try another email." })
                    }
                    else if (data.error === "wrong-password") {
                        message.error({ content: "Password is incorrect. Please try again." })
                    }
                    else if (data.error === "switching-disabled") {
                        message.error("Category switching is currently disabled by the admins.")
                    }
                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
                setLoading(false)
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", marginBottom: "2vh" }}
        >

            <h3>Category:</h3>
            <Form.Item
                name="category"
                rules={[{ required: true, message: 'Please select a category', }]}>

                <Radio.Group>
                    <Space direction="vertical">
                        {options}
                    </Space>
                </Radio.Group>
            </Form.Item>
            <span>Select a category to compete and be eligible for prizes of that category. Verification will be required after the CTF before claiming your prizes.</span>

            <Form.Item>
                <Button type="primary" htmlType="submit" icon={<ApartmentOutlined />} loading={loading} style={{ marginTop: "2ch" }}>Change Category</Button>
            </Form.Item>
        </Form>
    );
}

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

const ChangePasswordForm = (props) => {
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            name="changePassword"
            className="change-password-form"
            onFinish={(values) => {

                fetch(window.ipAddress + "/v1/account/adminChangePassword", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "password": values.newPassword,
                        "username": props.username,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Password changed successfully." })
                        form.resetFields()
                        props.setState({ passwordResetModal: false })
                    }
                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}
        >
            <h3>New Password:</h3>
            <Form.Item
                name="newPassword"
                rules={[
                    {
                        required: true,
                        message: 'Please input the new password',
                    },
                ]}
                hasFeedback
            >

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter a new password" />
            </Form.Item>

            <h3>Confirm New Password:</h3>
            <Form.Item
                name="confirm"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    {
                        required: true,
                        message: 'Please retype the new password to confirm',
                    },
                    ({ getFieldValue }) => ({
                        validator(rule, value) {
                            if (!value || getFieldValue('newPassword') === value) {
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
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ passwordResetModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<KeyOutlined />}>Change Password</Button>
            </Form.Item>
        </Form>
    );
}

const ChangeEmailForm = (props) => {
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            onFinish={(values) => {
                fetch(window.ipAddress + "/v1/account/adminChangeEmail", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "username": props.username,
                        "email": values.email,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Email changed successfully." })
                        form.resetFields()
                        props.setState({ emailChangeModal: false })
                        props.fillTableData()
                    }
                    else if (data.error === "email-taken") {
                        message.error("Email is already in use. Please try another email.")
                    }
                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}
        >
            <h3>New Email</h3>
            <Form.Item
                name="email"
                rules={[
                    {
                        required: true,
                        message: 'Please input the new email',
                    },
                    {
                        type: 'email',
                        message: 'Please enter a valid email'
                    }
                ]}
                hasFeedback
            >

                <Input allowClear prefix={<MailOutlined />} placeholder="Enter a new email" />
            </Form.Item>

            <Form.Item>
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ emailChangeModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<MailOutlined />}>Change Email</Button>
            </Form.Item>
        </Form>
    );
}


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
            registerDisable: false,
            disableLoading: false,
            disableLoading2: false,
            disableLoading3: false,
            adminShowDisable: false,
            selectedTableKeys: [],
            disableEditButtons: true,
            uploadSize: 512000,
            uploadLoading: false,
            uploadPath: "",
            uploadPathLoading: false,
            passwordResetModal: false,
            teamMode: false,
            teamMaxSize: 3,
            forgotPass: false,
            emailVerify: false,
            teamChangeDisable: false,
            emailChangeModal: false,
            loginDisable: false,
            categoryList: [],
            newCategoryValue: "",
            addCategoryLoading: false,
            categoryChangeModal: false,
            participantCategory: ""
        }
    }

    componentDidMount() {
        this.fillTableData()
        this.getDisableStates()
    }

    getDisableStates = async () => {
        this.setState({ disableLoading: true })
        await fetch(window.ipAddress + "/v1/account/disableStates", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                //console.log(data)
                this.setState({ categorySwitchDisable: data.states.categorySwitchDisable, categoryList: data.states.categoryList, loginDisable: data.states.loginDisable, teamChangeDisable: data.states.teamChangeDisable, emailVerify: data.states.emailVerify, forgotPass: data.states.forgotPass, registerDisable: data.states.registerDisable, adminShowDisable: data.states.adminShowDisable, uploadSize: data.states.uploadSize, uploadPath: data.states.uploadPath, teamMode: data.states.teamMode, teamMaxSize: data.states.teamMaxSize })
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
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                for (let i = 0; i < data.list.length; i++) {
                    data.list[i].key = data.list[i].username
                    data.list[i].verified = "code" in data.list[i] ? "❌" : "✅"
                    data.list[i].team = data.list[i].username in data.usernameTeamCache ? data.usernameTeamCache[data.list[i].username] : "N/A"
                    data.list[i].category = "category" in data.list[i] ? data.list[i].category : "none"
                }
                this.setState({ dataSource: data.list })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ loading: false })
    }

    changePermissions = async () => {
        this.setState({ modalLoading: true })
        await fetch(window.ipAddress + "/v1/account/permissions", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "username": this.state.username,
                "type": this.state.permissionChangeTo
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success({ content: "Permissions changed successfully" })
                this.setState({ permissionModal: false })
                this.fillTableData()
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ modalLoading: false })
    }



    deleteAccounts = async (close, users) => {
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/account/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "users": users,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {

                message.success({ content: "User(s) [" + users.join(', ') + "] deleted successfully" })
                this.fillTableData()
            }
            else if (data.error === "delete_self") {
                message.error("You cannot delete your own account here")
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }



        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });

        })
        close()
        this.setState({ selectedTableKeys: [] })

    }

    createAccount = (values) => {
        this.setState({ modalLoading: true })
        fetch(window.ipAddress + "/v1/account/create", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', 'Authorization': window.IRSCTFToken },
            body: JSON.stringify({
                "username": values.username,
                "password": values.password,
                "email": values.email
            })
        }).then((results) => {
            //console.log(results)
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success({ content: "Created user " + values.username + " successfully!" })
                this.setState({ modalLoading: false, createUserModal: false })
                this.fillTableData()
            }
            else if (data.error === "email-taken") {
                message.warn({ content: "Oops. Email already taken" })
            }
            else if (data.error === "email-verify") {
                message.success("Created user " + values.username + " successfully!")
                message.info("The user will be required to verify his/her email " + data.emailVerify + " before being able to log into the platform", 5)
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

    disableSetting = async (setting, value) => {
        const settingList = {
            "registerDisable": { name: "User registration", loading: "disableLoading", disable: true },
            "adminShowDisable": { name: "Admin scores", loading: "disableLoading2", disable: true },
            "teamMode": { name: "Team mode", loading: "disableLoading3", disable: false },
            "forgotPass": { name: "Forgot password reset", loading: "disableLoading2", disable: false },
            "emailVerify": { name: "Email verification", loading: "disableLoading2", disable: false },
            "teamChangeDisable": { name: "Team changing", loading: "disableLoading2", disable: true },
            "loginDisable": { name: "User login", loading: "disableLoading2", disable: true },
            "categorySwitchDisable": { name: "Category switching ", loading: "disableLoading2", disable: true },
        }
        const tempLoading = {}
        tempLoading[settingList[setting].loading] = true
        this.setState(tempLoading)
        await fetch(window.ipAddress + "/v1/adminSettings", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                disable: value,
                setting: setting
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                const settingObj = settingList[setting]
                let setObj = {}
                setObj[setting] = value
                this.setState(setObj)

                let suffix = " disabled"
                if (settingObj.disable) {
                    if (value) suffix = " disabled"
                    else suffix = " enabled"
                }
                else {
                    if (value) suffix = " enabled"
                    else suffix = " disabled"
                }
                message.success(settingObj.name + suffix)
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false, disableLoading2: false, disableLoading3: false })
    }

    changeSetting = async (setting, value) => {

        const settingList = {
            "uploadSize": { name: "Upload Size", loading: "uploadLoading", suffix: "B" },
            "uploadPath": { name: "Profile pictures upload path", loading: "uploadPathLoading", suffix: "" },
            "teamMaxSize": { name: "Team mode", loading: "Maximum size of teams", suffix: "" }
        }
        const tempLoading = {}
        tempLoading[settingList[setting].loading] = true
        this.setState(tempLoading)
        await fetch(window.ipAddress + "/v1/adminSettings", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                disable: value,
                setting: setting
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                const settingObj = settingList[setting]
                let setObj = {}
                setObj[setting] = value
                this.setState(setObj)
                message.success(settingObj.name + " changed to " + value.toString() + settingObj.suffix)
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ uploadLoading: false, uploadPathLoading: false })
    }

    verifyAccounts = async (close, users) => {
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/email/adminVerify", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "users": users,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "User(s) [" + users.join(', ') + "] verified successfully" })
                this.fillTableData()
            }
            else message.error("Oops. Unknown error")

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });

        })
        close()
        this.setState({ selectedTableKeys: [] })
    }

    unverifyAccounts = async (close, users) => {
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/email/adminUnVerify", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "users": users,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "User(s) [" + users.join(', ') + "] un-verified successfully" })
                this.fillTableData()
            }
            else message.error("Oops. Unknown error")

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });

        })
        close()
        this.setState({ selectedTableKeys: [] })
    }


    handleTableSelect = (selectedRowKeys) => {
        this.setState({ selectedTableKeys: selectedRowKeys })
        if (this.state.disableEditButtons && selectedRowKeys.length > 0) this.setState({ disableEditButtons: false })
        else if (!this.state.disableEditButtons && selectedRowKeys.length === 0) this.setState({ disableEditButtons: true })
    }

    addCategory = async () => {
        this.setState({ addCategoryLoading: true })
        await fetch(window.ipAddress + "/v1/account/category/add", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "category": this.state.newCategoryValue,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "User category '" + this.state.newCategoryValue + "' created successfully." })
                const newList = this.state.categoryList
                newList.push(this.state.newCategoryValue)
                this.setState({ newCategoryValue: "", categoryList: newList })
            }
            else if (data.error === "category-exists") {
                message.error("A category with the same name already exists.")
            }
            else message.error("Oops. Unknown error")

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });

        })
        this.setState({ addCategoryLoading: false })
    }

    removeCategory = async (category) => {
        await fetch(window.ipAddress + "/v1/account/category/remove", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "category": category,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "User category '" + category + "' removed successfully." })
                const newList = this.state.categoryList
                newList.splice(newList.indexOf(category), 1)
                this.setState({ categoryList: newList })
            }
            else if (data.error === "not-found") {
                message.error("Category '" + category + "' does not exists. Perhaps it has already been deleted.")
            }
            else message.error("Oops. Unknown error")

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });

        })
    }

    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

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
                    footer={null}
                    onCancel={() => { this.setState({ createUserModal: false }) }}
                >

                    <RegisterForm createAccount={this.createAccount.bind(this)} setState={this.setState.bind(this)} />
                </Modal>

                <Modal
                    title={"Changing Account Password For: " + this.state.username}
                    visible={this.state.passwordResetModal}
                    footer={null}
                    onCancel={() => { this.setState({ passwordResetModal: false }) }}
                >

                    <ChangePasswordForm username={this.state.username} setState={this.setState.bind(this)} />
                </Modal>

                <Modal
                    title={"Changing Category For: " + this.state.username}
                    visible={this.state.categoryChangeModal}
                    footer={null}
                    onCancel={() => { this.setState({ categoryChangeModal: false }) }}
                >

                    <SelectParticipantCategoryForm fillTableData={this.fillTableData.bind(this)} categoryList={this.state.categoryList} username={this.state.username} participantCategory={this.state.participantCategory} />
                </Modal>

                <Modal
                    title={"Changing Email For: " + this.state.username}
                    visible={this.state.emailChangeModal}
                    footer={null}
                    onCancel={() => { this.setState({ emailChangeModal: false }) }}
                >

                    <ChangeEmailForm fillTableData={this.fillTableData.bind(this)} username={this.state.username} setState={this.setState.bind(this)} />
                </Modal>


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", height: "2ch" }}>
                        <Button type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<UserOutlined />} onClick={() => { this.setState({ createUserModal: true }) }}>Create New User</Button>
                        {this.state.loading && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Ellipsis color="#177ddc" size={60} ></Ellipsis>
                                <h1>Loading Users</h1>
                            </div>
                        )}
                    </div>
                    <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<RedoOutlined />} onClick={async () => { await Promise.all([this.fillTableData(), this.getDisableStates()]); message.success("Users list refreshed.") }} />
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <Button disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#a61d24" }} icon={<DeleteOutlined />} onClick={() => {
                        confirm({
                            confirmLoading: this.state.disableEditButtons,
                            title: 'Are you sure you want to delete the user(s) (' + this.state.selectedTableKeys.join(", ") + ')? This action is irreversible.',
                            icon: <ExclamationCircleOutlined />,
                            onOk: (close) => { this.deleteAccounts(close.bind(this), this.state.selectedTableKeys) },
                            onCancel: () => { },
                        });
                    }}>Delete Users</Button>
                    <Button type="default" disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#6e6e6e" }} icon={<CheckOutlined style={{ color: "#49aa19" }} />} onClick={() => {
                        confirm({
                            confirmLoading: this.state.disableEditButtons,
                            title: 'Are you sure you want to verify the user(s) (' + this.state.selectedTableKeys.join(", ") + ')?',
                            icon: <ExclamationCircleOutlined />,
                            onOk: (close) => { this.verifyAccounts(close.bind(this), this.state.selectedTableKeys) },
                            onCancel: () => { },
                        });
                    }}>Verify Users</Button>
                    <Button type="default" disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#6e6e6e" }} icon={<CloseOutlined style={{ color: "#a61d24" }} />} onClick={() => {
                        confirm({
                            confirmLoading: this.state.disableEditButtons,
                            title: 'Are you sure you want to un-verify the user(s) (' + this.state.selectedTableKeys.join(", ") + ')?',
                            content: 'Please note that this action will send a new email per user asking them to re-verify.',
                            icon: <ExclamationCircleOutlined />,
                            onOk: (close) => { this.unverifyAccounts(close.bind(this), this.state.selectedTableKeys) },
                            onCancel: () => { },
                        });
                    }}>Un-Verify Users</Button>
                </div>
                <Table rowSelection={{ selectedRowKeys: this.state.selectedTableKeys, onChange: this.handleTableSelect.bind(this) }} style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                    emptyText: (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                            <h1 style={{ fontSize: "200%" }}>No users found/created</h1>
                        </div>
                    )
                }}>
                    <Column title="Username" dataIndex="username" key="username"
                        render={(text, row, index) => {
                            return <Link to={"/Profile/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                        }}
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Username"
                                    value={selectedKeys[0]}
                                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                    onPressEnter={() => confirm()}
                                    style={{ marginBottom: 8, display: 'block' }}
                                    autoFocus
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
                        onFilter={(value, record) => record.username.toLowerCase().trim().includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}
                        sorter={(a, b) => {
                            if (a.username < b.username) return -1
                            else return 1
                        }}
                    />
                    <Column title="Email" dataIndex="email" key="email"
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Email"
                                    value={selectedKeys[0]}
                                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                    onPressEnter={() => confirm()}
                                    style={{ marginBottom: 8, display: 'block' }}
                                    autoFocus
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
                        onFilter={(value, record) => record.email.toLowerCase().trim().includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}
                    />
                    <Column title="Permissions" dataIndex="type" key="type" filters={[{ text: "Normal User (0)", value: 0 }, { text: "Challenge Creator (1)", value: 1 }, { text: "Admin (2)", value: 2 }]} onFilter={(value, record) => { return value === record.type }} />
                    <Column title="Team" dataIndex="team" key="team"
                        render={(text, row, index) => {
                            if (text != "N/A") return <Link to={"/Team/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                            else return text;
                        }}
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Team"
                                    value={selectedKeys[0]}
                                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                    onPressEnter={() => confirm()}
                                    style={{ marginBottom: 8, display: 'block' }}
                                    autoFocus
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
                        onFilter={(value, record) => record.team.toLowerCase().trim().includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}
                    />
                    <Column title="Category" dataIndex="category" key="category" filters={
                        this.state.categoryList.map((category) => {
                            return { text: category, value: category }
                        })} onFilter={(value, record) => { return value === record.category }} />
                    <Column title="Verified" dataIndex="verified" key="verified" filters={[{ text: "Verified", value: "True" }, { text: "Unverified", value: "False" }]} onFilter={(value, record) => { return value === record.verified }} />
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
                                    <Menu.Item onClick={() => {
                                        this.setState({ passwordResetModal: true, username: record.username })
                                    }}>
                                        <span>
                                            Change Password <KeyOutlined />
                                        </span>
                                    </Menu.Item>
                                    <Menu.Item onClick={() => {
                                        this.setState({ emailChangeModal: true, username: record.username })
                                    }}>
                                        <span>
                                            Change Email <MailOutlined />
                                        </span>
                                    </Menu.Item>
                                    <Menu.Item onClick={() => {
                                        this.setState({ categoryChangeModal: true, username: record.username, participantCategory: record.category })
                                    }}>
                                        <span>
                                            Change Category <ApartmentOutlined />
                                        </span>
                                    </Menu.Item>
                                </Menu>
                            } placement="bottomCenter">
                                <Button>Actions</Button>
                            </Dropdown>
                        )}
                    />
                </Table>

                <Divider />

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>Disable User Registration:  <Switch disabled={this.state.disableLoading} onClick={(value) => this.disableSetting("registerDisable", value)} checked={this.state.registerDisable} /></h3>
                        <p>Disables user registration for unregistered users. Admins can still create users from this page.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Disable User Logins:  <Switch disabled={this.state.disableLoading2} onClick={(value) => this.disableSetting("loginDisable", value)} checked={this.state.loginDisable} /></h3>
                        <p>Disables user login except for admin users. <br /><b>Note:</b> Users already logged into the platform will remain authenticated as tokens cannot be revoked. If you want to restrict a user from accessing the platform anymore, simply delete their account.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Disable Admin Scores:  <Switch disabled={this.state.disableLoading2} onClick={(value) => this.disableSetting("adminShowDisable", value)} checked={this.state.adminShowDisable} /></h3>
                        <p>Prevents admin scores from showing up on scoreboards and profile pages. Admin solves will still appear under the solve list in challenges. <br /> Please note that disabling/enabling this will require users to reopen ctfx to resync the scoreboard.</p>
                    </Card>
                </div>

                <Divider />

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>Profile Picture Max Upload Size: <InputNumber
                            formatter={value => `${value}B`}
                            parser={value => value.replace('B', '')}
                            value={this.state.uploadSize}
                            disabled={this.state.uploadLoading}
                            onChange={(value) => this.setState({ uploadSize: value })}
                            onPressEnter={(e) => { this.changeSetting("uploadSize", this.state.uploadSize) }} /></h3>

                        <p>Sets the maximum file upload size for profile pictures (in Bytes). Press <b>Enter</b> to save</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Disable Category Switches:  <Switch disabled={this.state.disableLoading2} onClick={(value) => this.disableSetting("categorySwitchDisable", value)} checked={this.state.categorySwitchDisable} /></h3>
                        <p>Prevents users from switching their scoreboard category. Useful during competitions where you want to lock the user into a category</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>User Category Management <UserOutlined /></h3>
                        <Space direction="vertical">
                            {this.state.categoryList.map((category) => {
                                return (
                                    <div style={{ display: 'flex', alignItems: "center" }}>
                                        <Input disabled value={category} />
                                         <MinusCircleOutlined onClick={() => { this.removeCategory(category) }} style={{ cursor: "pointer", marginLeft: "1ch", color: "#f5222d" }} />
                                    </div>
                                )
                            })}
                            <div style={{ display: "flex" }}>
                                <Input value={this.state.newCategoryValue} onChange={(e) => { this.setState({ newCategoryValue: e.target.value }) }} />
                                <Button
                                    loading={this.state.addCategoryLoading}
                                    style={{ marginLeft: "1ch" }}
                                    type="dashed"
                                    onClick={() => {
                                        this.addCategory()
                                    }}
                                >
                                    <PlusOutlined /> Add Category
                                </Button>
                            </div>
                        </Space>
                    </Card>
                </div>

                <Divider />

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>Max Team Size: <InputNumber
                            value={this.state.teamMaxSize}
                            onChange={(value) => this.setState({ teamMaxSize: value })}
                            onPressEnter={(e) => { this.changeSetting("teamMaxSize", this.state.teamMaxSize) }} />
                        </h3>
                        <p>Sets the maximum number of members in a team. Press <b>Enter</b> to save</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Enable Teams:  <Switch disabled={this.state.disableLoading3} onClick={(value) => this.disableSetting("teamMode", value)} checked={this.state.teamMode} /></h3>
                        <p>Enable teams for the platform. Users in a team will have their scores combined on the scoreboard <br /> Please note that disabling/enabling this will require users to reopen ctfx to resync the scoreboard.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Disable Team Switching:  <Switch disabled={this.state.disableLoading3} onClick={(value) => this.disableSetting("teamChangeDisable", value)} checked={this.state.teamChangeDisable} /></h3>
                        <p>Prevents users from leaving, joining & creating a team. Enable this option if you want to prevent any team changes during a competition</p>
                    </Card>
                </div>

                <Divider />

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>Enable Password Reset  <Switch disabled={this.state.disableLoading2} onClick={(value) => this.disableSetting("forgotPass", value)} checked={this.state.forgotPass} /></h3>
                        <p>Allow users to use the "Forgot Password" option to reset their password. <br />Please ensure that you have connected to an SMTP server correctly in the "Email" tab</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Enable Email Verification  <Switch disabled={this.state.disableLoading2} onClick={(value) => this.disableSetting("emailVerify", value)} checked={this.state.emailVerify} /></h3>
                        <p>Forces newly registered users to <b>verify their email</b> before being able to access the site.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Profile Picture Upload Path
                            <Input
                                value={this.state.uploadPath}
                                onChange={(e) => this.setState({ uploadPath: e.target.value })}
                                onPressEnter={(e) => { this.changeSetting("uploadPath", this.state.uploadPath) }} /></h3>
                        <p>Sets the file upload path for profile pictures. Please ensure that the folder has the appropriate permissions <br />set for the Node process to save the file there. Press <b>Enter</b> to save</p>
                    </Card>
                </div>

            </Layout>
        );
    }
}

export default AdminUsers;
