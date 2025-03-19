import beautify  from 'js-beautify'

export const formatHtmlFromUrl = (htmlContent: string):string => {
  try {
    const formattedHTML = beautify.html(htmlContent, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true,
      max_preserve_newlines: 2,
    });
    return formattedHTML;
  } catch (error) {
    console.log("Format Error: ", error)
    return null;
  }
};