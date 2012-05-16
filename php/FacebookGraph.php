<?php
/**
 * Wrapper for the Facebook Graph API (using the Zend Framework (http_client)).
 *
 */

/**
 * Class to access Facebook Graph API.
 *
 * A token is needed to use the Graph API.
 * Use getAuthUrl() to get the url that will give you a code, then
 * use getAccessToken() to convert that code into a valid access token.
 * or use getAppTokenUrl() to obtain a token to be used by an app.
 *
 * @see http://developers.facebook.com/docs/
 *
 */
class FacebookGraph
{
    private $_baseUrl = 'https://graph.facebook.com';
    private $_useragent = 'gatineau-ouverte conseillers v1.0';
    private $_appId;
    private $_appSecret;
    private $_httpClient;
    public  $accessToken;

    public function __construct($appId, $appSecret, $httpClient = null)
    {
        $this->_appId = $appId;
        $this->_appSecret = $appSecret;

        if ($httpClient) {
            $this->_httpClient = $httpClient;
        } else {
            $this->_httpClient = new Zend_Http_Client();
        }
    }

    /**
     * Get the url to authorize on Facebook.
     *
     * Client Requests Authorization
     *
     * @see http://developers.facebook.com/docs/authentication/
     *
     * @param string $next callback url
     * @param string $permissions coma separated permissions
     * @return string
     */
    public function getAuthUrl($next, $permissions = 'offline_access')
    {
        $params = array(
//FIXME type is required by the OAuth specs, but not working with facebook yet (201004260)
//            'type' => 'user_agent',
            'client_id' => $this->_appId,
            'redirect_uri' => $next,
            'scope' => $permissions,
            'display' => 'page'
        );

        return $this->_baseUrl . '/oauth/authorize?' . http_build_query($params);
    }

    /**
     * After OAuth this need to be called to exchange the 'code' for an 'access_token'.
     *
     * Client Requests Access Token
     *
     * We're not using $this->query() here, because this is the only function that
     * don't always return json. We're not gonna clobber query() for this single exception.
     *
     * @param string $code 'code' received after redirect of getOAuthAuthorizeUrl
     * @param string $next callback url as set in getOAuthAuthorizeUrl
     */
    public function getAccessToken($code, $next)
    {
        // Exchange the received 'code' for an OAuth access_token
        $this->_httpClient->resetParameters();
        $this->_httpClient->setUri($this->_baseUrl . '/oauth/access_token');
        $this->_httpClient->setParameterGet(array(
//FIXME type is required by the OAuth specs, but not working with facebook yet (201004260)
//            'type' => 'web_server',
            'client_id' => $this->_appId,
            'redirect_uri' => $next,
            'client_secret' => $this->_appSecret,
            'code' => $code
        ));

        $response = $this->_httpClient->request('GET');

        parse_str($response->getBody(), $parsed);

        if (!isset($parsed['access_token'])) {
            //Gotcha! Error are return in JSON format, and success in querystring format.
            $json = json_decode($response->getBody(), true);
            var_dump($json);
            if (isset($json['error']['message'])) {
                throw new Exception($json['error']['message']);
            } else {
                throw new Exception($json);
            }
        }

        $this->accessToken = $parsed['access_token'];

        return $this->accessToken;
    }

    /**
     * Get the url to authenticate as an app.
     *  Authenticating as an App allows you to obtain an access token which
     *  allows you to make request to the Facebook API on behalf of an App
     *  rather than a User.
     *
     * @return string url
     */
    public function getAppTokenUrl()
    {
        return "https://graph.facebook.com/oauth/access_token?" .
            http_builg_query(array(
                'client_id' => $this->_appId,
                'client_secret' => $this->_appSecret,
                'grant_type' => client_credentials
        ));
    }

    /**
     * Generic wrapper to call any Facebook Graph API methods.
     *
     * @see https://developers.facebook.com/docs/reference/api/
     *
     * @param string $path graph api method
     * @param array $params query parameters, method
     */
    public function query($path, $params=array())
    {
        if (!isset($params['method'])) {
            $method = 'GET';
        } else {
            $method = strtoupper($params['method']);
            unset($params['method']);
        }

        $this->_httpClient->resetParameters();
        $this->_httpClient->setUri($this->_baseUrl . $path);

        switch ($method) {
            case 'DELETE':
                // fallthru
            case 'GET':
                $this->_httpClient->setParameterGet('access_token', $this->accessToken);
                $this->_httpClient->setParameterGet($params);
                break;
            case 'PUT':
                // fallthru
            case 'POST':
                $this->_httpClient->setParameterPost('access_token', $this->accessToken);
                $this->_httpClient->setParameterPost($params);
                break;
        }

        $result = json_decode(
            $this->_httpClient->request($method)->getBody(),
            true
        );

        return $result;
    }
}
