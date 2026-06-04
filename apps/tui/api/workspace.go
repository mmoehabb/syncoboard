package api

import "fmt"

type Workspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func GetUserWorkspaces() ([]Workspace, error) {
	var workspaces []Workspace
	err := doRequest("GET", "/workspaces", nil, &workspaces)
	return workspaces, err
}

func DeleteWorkspace(workspaceName string) error {
	endpoint := fmt.Sprintf("/workspaces/%s", workspaceName)
	return doRequest("DELETE", endpoint, nil, nil)
}

func RestoreWorkspace(workspaceName string) error {
	endpoint := fmt.Sprintf("/workspaces/%s/restore", workspaceName)
	return doRequest("POST", endpoint, nil, nil)
}

type UpdateWorkspaceStatusBody struct {
	IsActive bool `json:"isActive"`
}

func UpdateWorkspaceStatus(workspaceName string, isActive bool) error {
	endpoint := fmt.Sprintf("/workspaces/%s/status", workspaceName)
	body := UpdateWorkspaceStatusBody{IsActive: isActive}
	return doRequest("PUT", endpoint, body, nil)
}
