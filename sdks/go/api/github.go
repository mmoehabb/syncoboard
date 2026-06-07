package api

import (
	"fmt"
	"net/url"
)

type GithubService struct {
	client *Client
}

type GithubRepo struct {
	ID       int64  `json:"id"`
	NodeID   string `json:"node_id"`
	Name     string `json:"name"`
	FullName string `json:"full_name"`
	Private  bool   `json:"private"`
}

func (s *GithubService) GetRepos(workspaceID *string) ([]GithubRepo, error) {
	endpoint := "/github/repos"
	if workspaceID != nil {
		endpoint = fmt.Sprintf("%s?workspaceId=%s", endpoint, url.QueryEscape(*workspaceID))
	}
	var resp struct {
		Repos []GithubRepo `json:"repos"`
	}
	err := s.client.doRequest("GET", endpoint, nil, &resp)
	return resp.Repos, err
}
