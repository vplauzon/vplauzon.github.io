---
title:  Impersonating user with Data Explorer & Azure Storage
permalink: /2020/03/11/impersonating-user-with-data-explorer-azurestorage
categories:
- Solution
tags:
    - Data
    - Security
date: 2020-02-08
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/impersonating-user-with-data-explorer-azurestorage/airplane-blur-close-up-desk-346793.jpg" />

We discussed Azure Data Explorer (ADX) in a <span style="background-color:yellow">Past article</span>.

In this article I wanted to show how to access an Azure Storage Account using user impersonation, i.e. using the identity of the user running the queries to access the storage.

