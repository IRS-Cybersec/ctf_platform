import React, { useEffect } from 'react';
import { Layout, message, Avatar, Button, Form, Input, Divider, Upload, Modal, Tooltip, Radio, Space } from 'antd';
import {
    KeyOutlined,
    LockOutlined,
    UploadOutlined,
    DeleteOutlined,
    MailOutlined,
    ApartmentOutlined
} from '@ant-design/icons';
import { Ellipsis } from 'react-spinners-css';



const ChangePasswordForm = (props) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);

    return (
        <Form
            form={form}
            onFinish={async (values) => {
                setLoading(true)
                await fetch(window.ipAddress + "/v1/account/change/password", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "password": values.oldPass,
                        "new_password": values.newPassword,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Password changed successfully." })
                        form.resetFields()
                    }
                    else if (data.error === "wrong-password") {
                        message.error({ content: "Old password is incorrect. Please try again." })
                    }

                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
                setLoading(false);
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", marginBottom: "2vh" }}
        >
            <h3>Old Password:</h3>
            <Form.Item
                name="oldPass"
                rules={[{ required: true, message: 'Please input your old password', }]}>

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter your old password." />
            </Form.Item>
            <h3>New Password:</h3>
            <Form.Item
                name="newPassword"
                rules={[
                    {
                        required: true,
                        message: 'Please input your new password',
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
                        message: 'Please retype your new password to confirm',
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
                <Button type="primary" htmlType="submit" icon={<KeyOutlined />} loading={loading}>Change Password</Button>
            </Form.Item>
        </Form>
    );
}

const ChangeEmailForm = (props) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        if (props.email != "") {
            form.setFieldsValue({
                email: props.email,
                password: ""
            })
        }

    }, [props.email])

    return (
        <Form
            form={form}
            onFinish={async (values) => {
                setLoading(true)
                await fetch(window.ipAddress + "/v1/account/change/email", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "password": values.password,
                        "email": values.email,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Email changed successfully." })
                        form.setFieldsValue({
                            email: values.email,
                            password: ""
                        })
                    }
                    else if (data.error === "email-taken") {
                        message.error({ content: "Email is already taken, please try another email." })
                    }
                    else if (data.error === "wrong-password") {
                        message.error({ content: "Password is incorrect. Please try again." })
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

            <h3>Email:</h3>
            <Form.Item
                name="email"
                rules={[{ required: true, message: 'Please input your new email', }, { type: "email", message: "Please enter a valid email" }]}>

                <Input allowClear prefix={<MailOutlined />} placeholder="Enter your new email." />
            </Form.Item>

            <h3>Password:</h3>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password', }]}>

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter your password." />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" icon={<MailOutlined />} loading={loading}>Change Email</Button>
            </Form.Item>
        </Form>
    );
}

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

    }, [props.participantCategory])

    return (
        <Form
            form={form}
            onFinish={async (values) => {
                setLoading(true)
                await fetch(window.ipAddress + "/v1/account/change/category", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "category": values.category,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Category changed successfully to '" + values.category + "'." })
                        form.setFieldsValue({
                            category: values.category
                        })
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

const DeleteAccountForm = (props) => {
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            name="changePassword"
            className="change-password-form"
            onFinish={(values) => {

                fetch(window.ipAddress + "/v1/account/delete", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "password": values.password
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Account deleted successfully" })
                        props.setState({ deleteAccountModal: false })
                        props.logout()
                        form.resetFields()
                    }
                    else if (data.error === "wrong-password") {
                        message.error({ content: "Password is incorrect. Please try again." })
                    }
                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", marginBottom: "2vh" }}
        >
            <h4>Your account data will be <b style={{ color: "#d32029" }}>deleted permanently</b>. Please ensure you really no longer want this account.</h4>
            <h3>Please Enter Your Password To Confirm:</h3>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password', }]}>

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter password." />
            </Form.Item>


            <Form.Item>
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ deleteAccountModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" danger icon={<KeyOutlined />}>Delete Account</Button>
            </Form.Item>
        </Form>
    );
}

class Settings extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            fileList: [],
            disableUpload: false,
            deleteAccountModal: false,
            email: "",
            loading: true,
            participantCategory: "",
            categoryList: [""]
        }
    }

    componentDidMount() {
        this.getAccountSettings()
    }

    getAccountSettings = async () => {
        await fetch(window.ipAddress + "/v1/account/settings", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken }
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                let category = "none"
                if (data.category) category = data.category
                this.setState({ email: data.email, participantCategory: category, categoryList: data.categoryList })
            }
            else {
                message.error({ content: "Oops. Unknown error." })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ loading: false })
    }

    deleteProfilePic() {
        fetch(window.ipAddress + "/v1/profile/deleteUpload", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken }
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success({ content: "Reset profile picture to default" })
            }
            else if (data.error === "already-default") {
                message.warn("Profile picture is already default.")
            }
            else {
                message.error({ content: "Oops. Unknown error." })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }


    render() {
        return (
            <Layout className="layout-style">

                {this.state.loading ? (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} />
                    </div>
                ) : (
                    <div>
                        <Modal
                            title={"Delete Account"}
                            visible={this.state.deleteAccountModal}
                            footer={null}
                            onCancel={() => { this.setState({ deleteAccountModal: false }) }}
                            confirmLoading={this.state.modalLoading}
                        >

                            <DeleteAccountForm logout={this.props.logout.bind(this)} setState={this.setState.bind(this)} />
                        </Modal>


                        <Divider />
                        <div style={{ display: "flex", marginRight: "5ch", alignItems: "center", justifyItems: "center" }}>
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "initial", width: "20ch", overflow: "hidden" }}>
                                <Avatar style={{ backgroundColor: "transparent", width: "12ch", height: "12ch" }} size='large' src={"/static/profile/" + this.props.username + ".webp"} />
                                <div style={{ marginTop: "2ch", display: "flex" }}>
                                    <Upload
                                        fileList={this.state.fileList}
                                        disabled={this.state.disableUpload}
                                        accept=".png, .jpg, .jpeg, .webp"
                                        action={window.ipAddress + "/v1/profile/upload"}
                                        maxCount={1}
                                        onChange={(file) => {
                                            this.setState({ fileList: file.fileList })
                                            if (file.file.status === "uploading") {
                                                this.setState({ disableUpload: true })
                                            }
                                            else if ("response" in file.file) {
                                                if (file.file.response.success) {
                                                    message.success("Uploaded profile picture")
                                                    message.success("Reload the page to see your shiny new picture :)!")
                                                }
                                                else {
                                                    message.error("Failed to upload profile picture")
                                                    if (file.file.response.error === "too-large") {
                                                        message.info("Please upload a file smaller than " + file.file.response.size.toString() + " Bytes.")
                                                    }
                                                }
                                                this.setState({ fileList: [], disableUpload: false })
                                            }
                                        }}
                                        headers={{ "Authorization": window.IRSCTFToken }}
                                        name="profile_pic"
                                        beforeUpload={file => {
                                            const exts = ["image/png", "image/jpg", "image/jpeg", "image/webp"]
                                            if (!exts.includes(file.type)) {
                                                message.error(`${file.name} is not an image file.`);
                                                return Upload.LIST_IGNORE
                                            }
                                            return true
                                        }}>
                                        <Tooltip title={<span>Upload a custom profile picture.</span>}>
                                            <Button type="primary" icon={<UploadOutlined />}>Upload</Button>
                                        </Tooltip>
                                    </Upload>
                                    <Tooltip title={<span>Reset your profile picture to the default profile picture.</span>}>
                                        <Button danger type="primary" icon={<DeleteOutlined />} style={{ marginLeft: "1ch" }} onClick={() => { this.deleteProfilePic() }} />
                                    </Tooltip>
                                </div>
                            </div>
                            <h1 style={{ fontSize: "5ch", marginLeft: "1ch" }}>{this.props.username}</h1>
                        </div>

                        <Divider />

                        <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                            <div className="form-style">
                                <h1 className="settings-header"><KeyOutlined /> Change Password</h1>
                                <ChangePasswordForm />
                            </div>

                            <Divider type="vertical" style={{ height: "inherit" }} />


                            <div className="form-style">
                                <h1 className="settings-header"><MailOutlined /> Change Email</h1>
                                <ChangeEmailForm email={this.state.email} />
                            </div>
                        </div>

                        <Divider />

                        <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                            <div className="form-style">
                                <h1 className="settings-header"><ApartmentOutlined /> Select Participant Category</h1>
                                <SelectParticipantCategoryForm participantCategory={this.state.participantCategory} categoryList={this.state.categoryList} />
                            </div>
                        </div>

                        <Divider />


                        <div>
                            <h3>Very Very Dangerous Button</h3>
                            <Button danger type="primary" icon={<DeleteOutlined />} onClick={() => { this.setState({ deleteAccountModal: true }) }} >Delete Account</Button>
                            <p>You will be asked to key in your password to confirm</p>
                        </div>
                    </div>
                )}
            </Layout>
        )
    }
}




export default Settings;
