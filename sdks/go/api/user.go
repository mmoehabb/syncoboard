package api

type UserService struct {
	client *Client
}

func (s *UserService) UpdateLastOnline() error {
	return s.client.doRequest("POST", "/user/activity", nil, nil)
}
