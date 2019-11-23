---
layout: empty
---
[
    {% for post in site.posts %}
        {% raw  %} { {% endraw  %}
            "url" : "{{ post.url }}",
            "title" : "{{ post.title }}"
        {% raw  %} } {% endraw  %}
    {% endfor %}
    {% if site.posts.last.url != post.url %}
    ,
    {% endif %}
]