import React, { useState } from 'react';
import { Layout, Table, message, Button, Modal, Transfer, Divider, Input, Space, InputNumber, Card, Select, Form, Upload } from 'antd';
import DatePicker from './../Components/DatePicker';
import { Switch as AntdSwitch } from 'antd';
import dayjs from 'dayjs';
import {
    ExclamationCircleOutlined,
    DeleteOutlined,
    FlagOutlined,
    EditOutlined,
    FileUnknownTwoTone,
    EyeOutlined,
    EyeInvisibleOutlined,
    RedoOutlined,
    SearchOutlined,
    DownloadOutlined,
    UploadOutlined
} from '@ant-design/icons';
import AdminChallengeCreate from "./adminChallengeCreate.js";
import AdminChallengeEdit from "./adminChallengeEdit.js";
import { Ellipsis } from 'react-spinners-css';
import { Switch, Route, Link } from 'react-router-dom';

const { Column } = Table;
const { confirm } = Modal;
const { Option } = Select;
const { Dragger } = Upload;
const { RangePicker } = DatePicker;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const pos = reader.result.indexOf("base64,")
        resolve(reader.result.slice(pos + 7))
    };
    reader.onerror = error => reject(error);
})

const EditCategoryForm = (props) => {
    const [form] = Form.useForm();
    const [fileList, updateFileList] = useState([])
    const [editLoading, updateEditLoading] = useState(false)
    const [time, updateTime] = useState([])
    const [useDefaultPic, updateUseDefaultPic] = useState(false)

    if (form.getFieldValue("name") !== props.initialData.name) {
        let initialData = JSON.parse(JSON.stringify(props.initialData))
        initialData.name = props.initialData.name
        if (props.initialData.time.length > 0) initialData.time = [dayjs(props.initialData.time[0]), dayjs(props.initialData.time[1])]


        form.setFieldsValue(initialData)
    }

    return (
        <Form
            form={form}
            onFinish={async (values) => {
                updateEditLoading(true)
                let fileData = ""
                if (useDefaultPic) {
                    fileData = "default"
                }
                else {
                    if (fileList.length > 0) {
                        // make a request to update category picture here
                        try {
                            fileData = await fileToBase64(fileList[0].originFileObj)
                        }
                        catch (e) {
                            console.log(e)
                            message.error({ content: "Oops. Unknown error" })
                        }
                    }
                }
                await fetch(window.ipAddress + "/v1/challenge/edit/category", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "name": props.initialData.name,
                        "new_name": values.name,
                        "categoryImage": fileData,
                        "time": time // time is in UTC+0
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Edited category \"" + props.initialData.name + "\" successfully!" })
                        props.handleEditCategoryDone()
                    }
                    else {
                        message.error({ content: "Oops. Unknown error" })
                    }
                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
                updateEditLoading(false)
            }}
        >
            <p><b><u>Editing:</u></b> <code>{props.initialData.name}</code></p>


            <h1>Category Name:</h1>
            <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter a category name' }]}
            >
                <Input allowClear placeholder="Category name" />
            </Form.Item>

            <h1>Category Cover Image:</h1>
            {!useDefaultPic ? (
                <img src={"/static/category/" + props.initialData.name + ".webp"} />
            ) : (
                <img src={"/static/category/default.webp"} />
            )}
            <Button danger type="primary" icon={<DeleteOutlined />} disabled={useDefaultPic} style={{ marginTop: "1ch", marginBottom: "5ch" }} onClick={() => { updateUseDefaultPic(true) }}>Reset To Default</Button>


            {!useDefaultPic && (
                <Form.Item
                    name="categoryImage"
                >

                    <Dragger
                        fileList={fileList}
                        disabled={editLoading}
                        accept=".png, .jpg, .jpeg, .webp"
                        maxCount={1}
                        onChange={(file) => {
                            updateFileList(file.fileList)
                        }}
                        beforeUpload={(file) => {
                            return false
                        }}>
                        <h4>Drag and drop an image file (.png, .jpeg, .webp etc.) to upload.</h4>
                    </Dragger>
                </Form.Item>
            )}


            <h1>Category Competition Time</h1>
            <Form.Item
                name="time"
            >
                <RangePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    onChange={(date) => { if (date && date.length > 0) updateTime([date[0].toISOString(), date[1].toISOString()]) }}
                />
            </Form.Item>

            <Button type="primary" htmlType="submit" style={{ marginBottom: "1.5vh" }} loading={editLoading}>Edit Category</Button>

        </Form>
    );
};

const UploadChallengesForm = (props) => {
    const [form] = Form.useForm();
    const [fileList, updateFileList] = useState([])
    const [editLoading, updateEditLoading] = useState(false)

    return (
        <Form
            form={form}
            onFinish={async (values) => {
                updateEditLoading(true)
                let fileData = await fileList[0].originFileObj.text()
                try {
                    JSON.parse(fileData)
                }
                catch (e) {
                    console.error(e)
                    message.error("Invalid json.")
                    updateEditLoading(false)
                    return false
                }

                await fetch(window.ipAddress + "/v1/challenge/upload", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "challenges": fileData
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Uploaded challenges successfully" })
                        props.closeUploadChallenges()
                        props.handleRefresh()
                    }
                    else if (data.error === "failed-insert") {
                        message.warn("Some challenges already exist and were not inserted. Please delete the challenges to insert from the backup.", 3)
                        message.warn("The challenges are: [" + data.failedInsert.join(" ,") + "]", 5)
                    }
                    else {
                        message.error({ content: "Oops. Unknown error" })
                    }
                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })

                updateEditLoading(false)
            }}
        >
            <Form.Item
                name="challenges"
            >

                <Dragger
                    fileList={fileList}
                    disabled={editLoading}
                    accept=".json"
                    maxCount={1}
                    onChange={(file) => {
                        updateFileList(file.fileList)
                    }}
                    beforeUpload={(file) => {
                        return false
                    }}>
                    <h4>Drag and drop a challenge backup file (.json) to upload challenge(s).</h4>
                </Dragger>
            </Form.Item>
            <span>Please note that hint purchases and solves are <b>not brought over</b> as this is equivalent to "creating a new challenge from a backup"</span>

            <Button icon={<UploadOutlined/>} type="primary" htmlType="submit" style={{ marginBottom: "1.5vh", marginTop: "3vh" }} loading={editLoading}>Upload Challenge(s)</Button>

        </Form>
    );
};

class AdminChallenges extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            id: "",
            modalLoading: false,
            challengeCreate: false,
            editChallenge: false,
            selectedKeys: [],
            selectedTableKeys: [],
            disableEditButtons: true,
            targetKeys: [],
            allCat: [],
            transferDisabled: false,
            refreshLoading: false,
            disableLoading: false,
            submissionDisabled: false,
            selectedRows: [],
            IDNameMapping: {},
            maxSockets: 0,
            categoryMeta: {},
            categoryOptions: [],
            currentEditCategory: false,
            categorySelect: "",
            uploadModalVisible: false
        }
    }

    componentDidUpdate(prevProps) {
        // Handle any page changes 
        if (this.state.editChallenge && this.props.location.pathname !== "/Admin/Challenges/Edit") {
            this.setState({ editChallenge: false })
        }
        else if (this.state.challengeCreate && this.props.location.pathname !== "/Admin/Challenges/Create") {
            this.setState({ challengeCreate: false })
        }
    }


    componentDidMount = async () => {
        const location = this.props.location.pathname
        if (location === "/Admin/Challenges/Create") {
            await this.setState({ challengeCreate: true })
        }
        else if (location === "/Admin/Challenges/Edit") {
            message.warn("Please select a challenge from the table to edit")
            await this.props.history.push("/Admin/Challenges")
        }
        this.handleRefresh()
        this.getDisableStates()
    }


    handleCategoryData = async () => {
        this.setState({ transferDisabled: true })
        let invisible = []
        let allCat = []

        const categoryMeta = await fetch(window.ipAddress + "/v1/challenge/listCategoryInfo", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) return data.categories
            else message.error({ content: "Oops. Unknown error" })
        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })

        // handle visibility manager
        let categoryOptions = []
        for (const cat in categoryMeta) {
            allCat.push({ "key": cat })
            categoryOptions.push((<Option value={cat}>{cat}</Option>))
            if (categoryMeta[cat].visibility === false) invisible.push(cat)
        }
        this.setState({ targetKeys: invisible, allCat: allCat, transferDisabled: false, categoryMeta: categoryMeta, categoryOptions: categoryOptions })
    }

    handleChange = (nextTargetKeys, direction, moveKeys) => {
        this.setState({ targetKeys: nextTargetKeys, transferDisabled: true });

        if (direction === "right") {
            this.editCategoryVisibility(false, moveKeys)
        }
        else {
            this.editCategoryVisibility(true, moveKeys)
        }
    }

    handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] })
    }

    editCategoryVisibility(visibility, categories) {
        fetch(window.ipAddress + "/v1/challenge/edit/categoryVisibility", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "visibility": visibility,
                "category": categories,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("The visibility of (" + categories.join(", ") + ") categories has been updated")
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            this.setState({ transferDisabled: false })
            this.fillTableData()


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    editChallengeVisibility = async (visibility, names, challenges) => {
        let challengeIDs = []
        for (let i = 0; i < challenges.length; i++) {
            challengeIDs.push(challenges[i]._id)
        }
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/challenge/edit/visibility", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "visibility": visibility,
                "challenges": challengeIDs,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("The visibility of (" + names.join(", ") + ") challenge(s) have been updated")
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            this.fillTableData()


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableEditButtons: false })
    }

    fillTableData = async () => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/challenge/list_all", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {

            if (data.success === true) {
                let IDNameMapping = {}
                for (var i = 0; i < data.challenges.length; i++) {
                    data.challenges[i].key = data.challenges[i].name
                    if (data.challenges[i].visibility === false) {
                        data.challenges[i].visibility = <span visibility={data.challenges[i].visibility.toString()} style={{ color: "#d32029" }}>Hidden <EyeInvisibleOutlined /></span>
                    }
                    else {
                        data.challenges[i].visibility = <span visibility={data.challenges[i].visibility.toString()} style={{ color: "#49aa19" }}>Visible <EyeOutlined /></span>
                    }
                    if (!data.challenges[i].dynamic) {
                        data.challenges[i].minimum = "N/A"
                        data.challenges[i].initial = "N/A"
                        data.challenges[i].minSolves = "N/A"
                    }
                    
                    IDNameMapping[data.challenges[i]._id] = data.challenges[i].name
                }
                this.setState({ dataSource: data.challenges, IDNameMapping: IDNameMapping, loading: false })

            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }



    deleteChallenge = async (close, names, challenges) => {
        let challengeIDs = []
        for (let i = 0; i < challenges.length; i++) {
            challengeIDs.push(challenges[i]._id)
        }
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/challenge/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "chall": challengeIDs,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Deleted challenges (" + names.join(", ") + ") successfully" })
                this.handleRefresh()

            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ selectedTableKeys: [] })
        close()

    }

    handleBack = async () => {
        await this.props.history.push("/Admin/Challenges")
        if (this.props.location.pathname === "/Admin/Challenges") this.setState({ challengeCreate: false })
    }

    handleEditBack = async () => {
        await this.props.history.push("/Admin/Challenges")
        if (this.props.location.pathname === "/Admin/Challenges") this.setState({ editChallenge: false })
    }

    handleCreateBack() {
        this.props.history.push("/Admin/Challenges")
        this.setState({ challengeCreate: false })
        this.handleRefresh()
    }

    handleEditChallBack() {
        this.props.history.push("/Admin/Challenges")
        this.setState({ editChallenge: false })
        this.handleRefresh()
    }

    handleRefresh = async () => {
        this.setState({ categorySelect: "" })
        await Promise.all([this.fillTableData(), this.handleCategoryData()])

    }

    handleTableSelect = (selectedRowKeys, selectedRows) => {
        this.setState({ selectedTableKeys: selectedRowKeys, selectedRows: selectedRows })
        if (this.state.disableEditButtons && selectedRowKeys.length > 0) this.setState({ disableEditButtons: false })
        else if (!this.state.disableEditButtons && selectedRowKeys.length === 0) this.setState({ disableEditButtons: true })
    }

    handleEditCategoryDone = () => {
        this.setState({ currentEditCategory: false })
        this.handleRefresh()
    }
    disableSetting = async (setting, value) => {

        let settingName = ""
        if (setting === "submissionDisabled") {
            settingName = "Challenge submission"
            this.setState({ disableLoading: true })
        }
        else if (setting === "disableNonCatFB") {
            settingName = "No Category First Bloods"
            this.setState({ disableLoading: true })
        }
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
                if (value) {
                    message.success(settingName + " disabled")
                }
                else {
                    message.success(settingName + " enabled")
                }
                if (setting === "submissionDisabled") this.setState({ submissionDisabled: value })
                else if (setting === "disableNonCatFB") this.setState({ disableNonCatFB: value })


            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }

    getDisableStates = async () => {
        this.setState({ disableLoading: true })
        await fetch(window.ipAddress + "/v1/challenge/disableStates", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                //console.log(data)
                this.setState({disableNonCatFB: data.states.disableNonCatFB, submissionDisabled: data.states.submissionDisabled, maxSockets: data.states.maxSockets })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }

    changeSetting = async (setting, value) => {
        let settingName = ""
        if (setting === "maxSockets") {
            settingName = "Maximum number of sockets"
            this.setState({ uploadLoading: true })
        }
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
                if (setting === "maxSockets") message.success(settingName + " changed to " + value.toString())
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ uploadLoading: false })
    }

    downloadChallenges = async (challenges) => {
        let challengeIDs = []
        let challengeNames = []
        for (let i = 0; i < challenges.length; i++) {
            challengeIDs.push(challenges[i]._id)
            challengeNames.push(challenges[i].name)
        }
        await fetch(window.ipAddress + "/v1/challenge/download", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                challenges: challengeIDs
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                const downloadData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ challenges: data.challenges }))
                const downloadAnchorNode = document.createElement('a');
                const date = new Date()
                downloadAnchorNode.setAttribute("href", downloadData);
                downloadAnchorNode.setAttribute("download", date.toISOString() + "-ChallengesBackup.json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                message.success("Successfully downloaded the challenges [" + challengeNames.join(", ") + "]")
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    openCategoryEditor = async (category) => {
        const catMeta = this.state.categoryMeta[category]
        this.setState({
            currentEditCategory: {
                name: category,
                time: "time" in catMeta ? catMeta.time : []
            },
            categorySelect: category
        })
    }





    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

                <Modal title={<span><UploadOutlined/> Upload Challenges</span>} visible={this.state.uploadModalVisible} footer={null} onCancel={() => {this.setState({uploadModalVisible: false})}}>
                    <UploadChallengesForm handleRefresh={this.handleRefresh.bind(this)} closeUploadChallenges={() => {this.setState({uploadModalVisible: false})}}/>
                </Modal>
                <div style={{ display: (!this.state.challengeCreate && !this.state.editChallenge) ? "initial" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", height: "2ch" }}>
                            <Button type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<FlagOutlined />} onClick={() => { this.setState({ challengeCreate: true }, this.props.history.push("/Admin/Challenges/Create")) }}>Create New Challenge</Button>
                            <Button type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<UploadOutlined />} onClick={() => { this.setState({uploadModalVisible: true}) }}>Upload Challenges</Button>
                            {this.state.loading && (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    <Ellipsis color="#177ddc" size={60} />
                                    <h1>Loading Challenges</h1>
                                </div>
                            )}
                        </div>
                        <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<RedoOutlined />} onClick={async () => { await this.handleRefresh(); message.success("Challenge list refreshed.") }} />

                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Button disabled={this.state.disableEditButtons} type="default" style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#6e6e6e" }} icon={<EyeOutlined style={{ color: "#49aa19" }} />} onClick={() => { this.editChallengeVisibility(true, this.state.selectedTableKeys, this.state.selectedRows) }}>Show</Button>
                            <Button disabled={this.state.disableEditButtons} type="default" style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#6e6e6e" }} icon={<EyeInvisibleOutlined style={{ color: "#d32029" }} />} onClick={() => { this.editChallengeVisibility(false, this.state.selectedTableKeys, this.state.selectedRows) }}>Hide</Button>
                            <Button disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#a61d24" }} icon={<DeleteOutlined />} onClick={() => {
                                confirm({
                                    confirmLoading: this.state.disableEditButtons,
                                    title: 'Are you sure you want to delete the challenge(s) (' + this.state.selectedTableKeys.join(", ") + ')? This action is irreversible.',
                                    icon: <ExclamationCircleOutlined />,
                                    onOk: (close) => { this.deleteChallenge(close.bind(this), this.state.selectedTableKeys, this.state.selectedRows) },
                                    onCancel: () => { },
                                });
                            }}>Delete Challenges</Button>
                        </div>
                        <div>
                            <Button disabled={this.state.disableEditButtons} type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<DownloadOutlined />} onClick={() => { this.downloadChallenges(this.state.selectedRows) }}>Download</Button>
                        </div>
                    </div>
                    <Table rowSelection={{ selectedRowKeys: this.state.selectedTableKeys, onChange: this.handleTableSelect.bind(this) }} style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                        emptyText: (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                <h1 style={{ fontSize: "200%" }}>No Challenges Found/Created</h1>
                            </div>
                        )
                    }}>
                        <Column title="Name" dataIndex="name" key="name"
                            render={(text, row, index) => {
                                return <Link to={"/Challenges/" + row._id}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                            }}
                            filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                                <div style={{ padding: 8 }}>
                                    <Input
                                        autoFocus
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
                            onFilter={(value, record) => record.name.toLowerCase().trim().includes(value.toLowerCase())}
                            filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}
                            sorter={(a, b) => {
                                if (a.name < b.name) return -1
                                else return 1
                            }}
                        />
                        <Column filters={this.state.allCat.map(value => { return { text: value.key, value: value.key } })} onFilter={(value, record) => value === record.category} title="Category" dataIndex="category" key="category" render={(text, row, index) => {
                            return <Link to={"/Challenges/" + row.category}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                        }} />
                        <Column sorter={(a, b) => a.points - b.points} title="Points" dataIndex="points" key="points" />
                        <Column sorter={(a, b) => a.points - b.points} title="Initial Points" dataIndex="initial" key="initial" />
                        <Column sorter={(a, b) => a.points - b.points} title="Solves to Min." dataIndex="minSolves" key="minSolves" />
                        <Column sorter={(a, b) => a.points - b.points} title="Min. Points" dataIndex="minimum" key="minimum" />
                        <Column filters={[{ text: "Visible", value: "true" }, { text: "Hidden", value: "false" }]} onFilter={(value, record) => { return value === record.visibility.props.visibility }} title="Visbility" dataIndex="visibility" key="visibility" />
                        <Column title="Required Challenge" dataIndex="requires" key="requires"
                            render={(text, row, index) => {
                                return <Link to={"/Challenges/" + text}><a style={{ fontWeight: 700 }}>{this.state.IDNameMapping[text]}</a></Link>;
                            }}
                            filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                                <div style={{ padding: 8 }}>
                                    <Input
                                        autoFocus
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
                            onFilter={(value, record) => { if (record.requires) return this.state.IDNameMapping[record.requires].toLowerCase().includes(value) }}
                            filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}
                            sorter={(a, b) => {
                                if (!a.requires) return -1
                                if (!b.requires) return 1
                                if (this.state.IDNameMapping[a.requires] < this.state.IDNameMapping[b.requires]) return -1
                                else return 1
                            }}
                        />
                        <Column
                            title=""
                            key="edit"
                            render={(text, record) => (
                                <Button icon={<EditOutlined />} onClick={() => { this.setState({ editChallenge: true, id: record._id }); this.props.history.push("/Admin/Challenges/Edit") }}> Edit</Button>
                            )}
                        />
                    </Table>

                    <Divider />
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h1 style={{ fontSize: "150%" }}>Category Management </h1>{this.state.transferDisabled && (<Ellipsis color="#177ddc" size={50} />)}
                    </div>

                    <Card className="settings-card">
                        <h3>Category Meta Information Editor <EyeOutlined /></h3>
                        <p>Select a category to edit info such as Name, Cover Pictures etc.</p>

                        <Select style={{ width: "30ch" }} value={this.state.categorySelect} onChange={this.openCategoryEditor.bind(this)}>
                            {this.state.categoryOptions}
                        </Select>

                        {this.state.currentEditCategory && (
                            <div style={{ padding: "10px", marginTop: "20px", backgroundColor: "rgba(0, 0, 0, 0.3)", border: "5px solid transparent", borderRadius: "10px" }}>
                                <EditCategoryForm initialData={this.state.currentEditCategory} handleEditCategoryDone={this.handleEditCategoryDone.bind(this)} />
                            </div>
                        )}
                    </Card>
                    <Card className="settings-card">
                        <h3>Category Visibility <EyeOutlined /></h3>
                        <Transfer
                            dataSource={this.state.allCat}
                            titles={[<span style={{ color: "#49aa19" }}>Visible Categories <EyeOutlined /></span>, <span style={{ color: "#d32029" }} >Hidden Categories <EyeInvisibleOutlined /></span>]}
                            targetKeys={this.state.targetKeys}
                            selectedKeys={this.state.selectedKeys}
                            onChange={this.handleChange}
                            onSelectChange={this.handleSelectChange}
                            render={item => item.key}
                            pagination
                            disabled={this.state.transferDisabled}
                        />
                    </Card>

                    <Divider />

                    <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                        <Card className="settings-card">
                            <h3>Disable Submissions:  <AntdSwitch disabled={this.state.disableLoading} onClick={(value) => this.disableSetting("submissionDisabled", value)} checked={this.state.submissionDisabled} /></h3>
                            <p>Prevents users from submitting any new submissions for all challenges. Hints can still be bought</p>
                        </Card>

                        <Divider type="vertical" style={{ height: "inherit" }} />

                        <Card className="settings-card">
                            <h3>Set Socket Limit:  <InputNumber
                                value={this.state.maxSockets}
                                disabled={this.state.disableLoading}
                                onChange={(value) => this.setState({ maxSockets: value })}
                                onPressEnter={(e) => { this.changeSetting("maxSockets", this.state.maxSockets) }} /></h3>
                            <p>Sets the maximum number of socket connections allowed <b>per account</b> to connect to the live scoreboard. <br /> <b>Press "Enter" to save</b></p>
                        </Card>

                        <Divider type="vertical" style={{ height: "inherit" }} />

                        <Card className="settings-card">
                        <h3>Disable First Blood for No Category:  <AntdSwitch disabled={this.state.disableLoading} onClick={(value) => this.disableSetting("disableNonCatFB", value)} checked={this.state.disableNonCatFB} /></h3>
                            <p>Prevents people with no categories from attaining first blood. Useful if you want to limit First Blood prizes to only eligible participants.</p>
                        </Card>


                    </div>


                </div>


                <Switch>
                    <Route exact path='/Admin/Challenges/Create' render={(props) => <AdminChallengeCreate {...props} challenges={this.state.dataSource} handleBack={this.handleBack.bind(this)} handleCreateBack={this.handleCreateBack.bind(this)} allCat={this.state.allCat} />} />
                    <Route exact path='/Admin/Challenges/Edit' render={(props) => <AdminChallengeEdit {...props} allCat={this.state.allCat} IDNameMapping={this.state.IDNameMapping} challenges={this.state.dataSource} id={this.state.id} handleEditBack={this.handleEditBack.bind(this)} handleEditChallBack={this.handleEditChallBack.bind(this)} />} />

                </Switch>

            </Layout>
        );
    }
}

export default AdminChallenges;
