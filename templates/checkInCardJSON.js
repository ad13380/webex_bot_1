const checkInCardJSON = {
  type: "AdaptiveCard",
  body: [
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          items: [
            {
              type: "TextBlock",
              text: "Team Check In",
              weight: "Lighter",
              color: "Accent",
            },
            {
              type: "TextBlock",
              text: "How are you doing?",
              horizontalAlignment: "Left",
              wrap: true,
              color: "Dark",
              size: "Large",
              spacing: "Small",
            },
          ],
          width: "stretch",
        },
      ],
    },
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: "Great",
              size: "Medium",
              horizontalAlignment: "Center",
            },
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "☀️",
                  data: {
                    feeling: "great",
                  },
                },
              ],
              horizontalAlignment: "Center",
              spacing: "None",
            },
          ],
          spacing: "Small",
          style: "good",
          horizontalAlignment: "Center",
          verticalContentAlignment: "Center",
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: "Good",
              spacing: "None",
              size: "Medium",
              horizontalAlignment: "Center",
            },
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "🌤",
                  data: {
                    feeling: "good",
                  },
                },
              ],
              horizontalAlignment: "Center",
              spacing: "None",
            },
          ],
          spacing: "Small",
          style: "accent",
          verticalContentAlignment: "Center",
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: "Ok",
              spacing: "None",
              size: "Medium",
              horizontalAlignment: "Center",
            },
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "☁️ ",
                  data: {
                    feeling: "ok",
                  },
                },
              ],
              spacing: "None",
              horizontalAlignment: "Center",
            },
          ],
          style: "attention",
          spacing: "Small",
          horizontalAlignment: "Center",
          verticalContentAlignment: "Center",
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: "Not Great",
              spacing: "Medium",
              horizontalAlignment: "Center",
              size: "Medium",
            },
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "☔️",
                  data: {
                    feeling: "not so great",
                  },
                },
              ],
              spacing: "None",
              horizontalAlignment: "Center",
            },
          ],
          spacing: "Small",
          style: "warning",
          verticalContentAlignment: "Center",
          horizontalAlignment: "Center",
        },
      ],
      spacing: "Padding",
      horizontalAlignment: "Center",
    },
  ],
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.2",
};

module.exports = checkInCardJSON;
