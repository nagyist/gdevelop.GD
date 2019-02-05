/* eslint-disable */ module.exports = {
  languageData: {
    plurals: function(n, ord) {
      var s = String(n).split('.'),
        v0 = !s[1],
        t0 = Number(s[0]) == n,
        n10 = t0 && s[0].slice(-1),
        n100 = t0 && s[0].slice(-2);
      if (ord)
        return n10 == 1 && n100 != 11
          ? 'one'
          : n10 == 2 && n100 != 12
          ? 'two'
          : n10 == 3 && n100 != 13
          ? 'few'
          : 'other';
      return n == 1 && v0 ? 'one' : 'other';
    },
  },
  messages: {
    "An error has occured during functions generation. If GDevelop is installed, verify that nothing is preventing GDevelop from writing on disk. If you're running GDevelop online, verify your internet connection and refresh functions from the Project Manager.":
      "An error has occured during functions generation. If GDevelop is installed, verify that nothing is preventing GDevelop from writing on disk. If you're running GDevelop online, verify your internet connection and refresh functions from the Project Manager.",
    'Another extension with this name already exists.':
      'Another extension with this name already exists.',
    'Another external layout with this name already exists.':
      'Another external layout with this name already exists.',
    'Another scene with this name already exists.':
      'Another scene with this name already exists.',
    "Are you sure you want to remove these external events? This can't be undone.":
      "Are you sure you want to remove these external events? This can't be undone.",
    "Are you sure you want to remove this extension? This can't be undone.":
      "Are you sure you want to remove this extension? This can't be undone.",
    "Are you sure you want to remove this external layout? This can't be undone.":
      "Are you sure you want to remove this external layout? This can't be undone.",
    "Are you sure you want to remove this scene? This can't be undone.":
      "Are you sure you want to remove this scene? This can't be undone.",
    'Close the project? Any changes that have not been saved will be lost.':
      'Close the project? Any changes that have not been saved will be lost.',
    Debugger: 'Debugger',
    Events: 'Events',
    'GDevelop is an easy-to-use game creator with no programming language to learn.':
      'GDevelop is an easy-to-use game creator with no programming language to learn.',
    'Other external events with this name already exist.':
      'Other external events with this name already exist.',
    'Project properly saved': 'Project properly saved',
    Resources: 'Resources',
    'Start Page': 'Start Page',
    'This name contains forbidden characters: please only use alphanumeric characters (0-9, a-z) and underscores in your extension name.':
      'This name contains forbidden characters: please only use alphanumeric characters (0-9, a-z) and underscores in your extension name.',
    'Unable to launch the preview!': 'Unable to launch the preview!',
    'Unable to open this project. Check that the path/URL is correct, that you selected a file that is a game file created with GDevelop and that is was not removed.':
      'Unable to open this project. Check that the path/URL is correct, that you selected a file that is a game file created with GDevelop and that is was not removed.',
    'Unable to save the project! Please try again by choosing another location.':
      'Unable to save the project! Please try again by choosing another location.',
  },
};
