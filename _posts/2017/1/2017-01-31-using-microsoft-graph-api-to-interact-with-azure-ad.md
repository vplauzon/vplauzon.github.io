---
title: Using Microsoft Graph API to interact with Azure AD
date: 2017-01-31 03:00:12 -08:00
permalink: /2017/01/31/using-microsoft-graph-api-to-interact-with-azure-ad/
categories:
- Solution
tags:
- Identity
- Security
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="/assets/posts/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/pexels-photo-898451.jpeg" width="224" height="240" align="right" border="0" />

In my <a href="https://vincentlauzon.com/2017/01/29/authenticating-to-azure-ad-non-interactively/" target="_blank" rel="noopener">last article</a>, I showed how to authenticate on Azure AD using a user name / password without using the native web flow.

The underlying scenario was to migrate an application using an LDAP server by leveraging an Azure AD tenant.

The logical continuation of that scenario is to use the <a href="https://graph.microsoft.io/en-us/" target="_blank" rel="noopener">Microsoft Graph API</a> to interact with the tenant the same way we would use LDAP queries to interact with the LDAP server.

Microsoft Graph API is a generalization of the Azure AD Graph API and should be used instead.  It consists of simple REST queries which <a href="https://graph.microsoft.io/en-us/docs/overview/overview" target="_blank" rel="noopener">are all documented</a>.

In this scenario, I’ll consider three simple interactions:

<ul>
    <li>Testing if a user exists</li>
    <li>Returning the groups a user belong to</li>
    <li>Creating a new user</li>
</ul>

But first we need to setup the Azure AD tenant.

<h2>Azure AD setup</h2>

We’re going to rely on the <a href="https://vincentlauzon.com/2017/01/29/authenticating-to-azure-ad-non-interactively/" target="_blank" rel="noopener">last article</a> to do the heavy lifting.

We are going to create a new application (here we’re going to use the name “QueryingApp”) of type Web App / API (although native should probably work).

The important part is to grab its Application-ID &amp; also to give it enough permission to create users.

<a href="/assets/posts/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image23.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image_thumb23.png" alt="image" border="0" /></a>

In this scenario, the application is going to authenticate itself (as opposed to a user) so we need to define a secret.

<a href="/assets/posts/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image24.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image_thumb24.png" alt="image" border="0" /></a>

We’ll need to add a key, save &amp; copy the key value.

<h2>Authenticating with ADAL</h2>

This sample is in C# / .NET but since the Active Directory Authentication Library (<a href="https://msdn.microsoft.com/en-us/library/azure/mt417579.aspx">ADAL</a>) is available on multiple platform (e.g. Java), this should be easy to port.

We need to install the NuGet package <a href="https://www.nuget.org/packages/Microsoft.IdentityModel.Clients.ActiveDirectory/">Microsoft.IdentityModel.Clients.ActiveDirectory</a> in our project.

```csharp

        private static async Task<string> AppAuthenticationAsync()
        {
            //  Constants
            var tenant = "LdapVplDemo.onmicrosoft.com";
            var resource = "https://graph.microsoft.com/";
            var clientID = "9a9f5e70-5501-4e9c-bd00-d4114ebeb419";
            var secret = "Ou+KN1DYv8337hG8o8+qRZ1EPqBMWwER/zvgqvmEe74=";

            //  Ceremony
            var authority = $"https://login.microsoftonline.com/{tenant}";
            var authContext = new AuthenticationContext(authority);
            var credentials = new ClientCredential(clientID, secret);
            var authResult = await authContext.AcquireTokenAsync(resource, credentials);

            return authResult.AccessToken;
        }
```

Here the <em>clientID </em>is the application ID of the application we created at <em>secret </em>is the secret key we created for it.

Here we return the access token as we’re going to use them.

<h2>Authenticating with HTTP POST</h2>

If we do not want to integrate with the ADAL, here’s the bare bone HTTP post version:

```csharp

        private static async Task<string> HttpAppAuthenticationAsync()
        {
            //  Constants
            var tenant = "LdapVplDemo.onmicrosoft.com";
            var clientID = "9a9f5e70-5501-4e9c-bd00-d4114ebeb419";
            var resource = "https://graph.microsoft.com/";
            var secret = "Ou+KN1DYv8337hG8o8+qRZ1EPqBMWwER/zvgqvmEe74=";

            using (var webClient = new WebClient())
            {
                var requestParameters = new NameValueCollection();

                requestParameters.Add("resource", resource);
                requestParameters.Add("client_id", clientID);
                requestParameters.Add("grant_type", "client_credentials");
                requestParameters.Add("client_secret", secret);

                var url = $"https://login.microsoftonline.com/{tenant}/oauth2/token";
                var responsebytes = await webClient.UploadValuesTaskAsync(url, "POST", requestParameters);
                var responsebody = Encoding.UTF8.GetString(responsebytes);
                var obj = JsonConvert.DeserializeObject<JObject>(responsebody);
                var token = obj["access_token"].Value<string>();

                return token;
            }
        }
```

Here I use the popular <a href="https://www.nuget.org/packages/Newtonsoft.Json/" target="_blank" rel="noopener">Newtonsoft Json Nuget Package</a> to handle JSON.

By no mean is the code here a master piece of robustness and style.  It is meant to be straightforward and easy to understand.  By all means, improve it %500 before calling it production ready!

<h2>Testing if a user exists</h2>

Here we’re going to use <a href="https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_get">Get a User</a> of Microsoft Graph API.

There is actually a NuGet package for <a href="https://www.nuget.org/packages/Microsoft.Graph" target="_blank" rel="noopener">Microsoft Graph API</a> and, in general <a href="https://graph.microsoft.io/en-us/code-samples-and-sdks" target="_blank" rel="noopener">SDKs (at the time of this writing) for 9 platforms</a>.

```csharp

        private static async Task<bool> DoesUserExistsAsync(HttpClient client, string user)
        {
            try
            {
                var payload = await client.GetStringAsync($"https://graph.microsoft.com/v1.0/users/{user}");

                return true;
            }
            catch (HttpRequestException)
            {
                return false;
            }
        }
```

Again, the code is minimalist here.  The HTTP GET actually returns user information that could be used.

<h2>Returning the groups a user belong to</h2>

Here we’re going to use the <a href="https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_list_memberof" target="_blank" rel="noopener">memberof</a> method of Microsoft Graph API.

```csharp

        private static async Task<string[]> GetUserGroupsAsync(HttpClient client, string user)
        {
            var payload = await client.GetStringAsync(
                $"https://graph.microsoft.com/v1.0/users/{user}/memberOf");
            var obj = JsonConvert.DeserializeObject<JObject>(payload);
            var groupDescription = from g in obj["value"]
                                   select g["displayName"].Value<string>();

            return groupDescription.ToArray();
        }
```

Here, we deserialize the returned payload to extract the group display names.  The information returned is richer and could be used.

<h2>Creating a new user</h2>

Finally we’re going to use the <a href="https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_post_users" target="_blank" rel="noopener">Create User</a> method of Microsoft Graph API.

This is slightly more complicated as it is an HTTP POST with a JSON payload in input.

```csharp

        private static async Task CreateUserAsync(HttpClient client, string user, string domain)
        {
            using (var stream = new MemoryStream())
            using (var writer = new StreamWriter(stream))
            {
                var payload = new
                {
                    accountEnabled = true,
                    displayName = user,
                    mailNickname = user,
                    userPrincipalName = $"{user}@{domain}",
                    passwordProfile = new
                    {
                        forceChangePasswordNextSignIn = true,
                        password = "tempPa$$w0rd"
                    }
                };
                var payloadText = JsonConvert.SerializeObject(payload);

                writer.Write(payloadText);
                writer.Flush();
                stream.Flush();
                stream.Position = 0;

                using (var content = new StreamContent(stream))
                {
                    content.Headers.Add("Content-Type", "application/json");

                    var response = await client.PostAsync("https://graph.microsoft.com/v1.0/users/", content);

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new InvalidOperationException(response.ReasonPhrase);
                    }
                }
            }
        }

```

<h2>Calling Code</h2>

The calling code looks like this:

```csharp


        private static async Task Test()
        {
            //var token = await AppAuthenticationAsync();
            var token = await HttpAppAuthenticationAsync();

            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var user = "test@LdapVplDemo.onmicrosoft.com";
                var userExist = await DoesUserExistsAsync(client, user);

                Console.WriteLine($"Does user exists?  {userExist}");

                if (userExist)
                {
                    var groups = await GetUserGroupsAsync(client, user);

                    foreach (var g in groups)
                    {
                        Console.WriteLine($"Group:  {g}");
                    }

                    await CreateUserAsync(client, "newuser", "LdapVplDemo.onmicrosoft.com");
                }
            }
        }

```

<h2>Summary</h2>

We can see that using the Microsoft Graph API, most if not all LDAP query can easily be converted.

Microsoft Graph API is aligned with OData v3 which makes it a great REST API where filtering queries are standardized.